/**
 * controllers/internshipPlatformController.js
 *
 * Install extra deps:
 *   npm install pdfkit nodemailer crypto
 */

const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { Op, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { sequelize } = require('../config/db');
const { User } = require('../models');
const {
  Domain, InternshipApplication, InternshipEnrollment,
  InternshipResource, InternshipCertificate,
} = require('../models/internshipPlatform');
const bcrypt = require('bcryptjs');

// ────────────────────────────────────────────────────────────────────
// DOMAINS
// ────────────────────────────────────────────────────────────────────

const getDomains = asyncHandler(async (req, res) => {
  const domains = await Domain.findAll({ where: { isActive: true }, order: [['name', 'ASC']] });
  res.json({ success: true, data: domains });
});

const createDomain = asyncHandler(async (req, res) => {
  const { name, description, icon, duration, totalSeats } = req.body;
  const domain = await Domain.create({ name, description, icon, duration, totalSeats });
  res.status(201).json({ success: true, data: domain });
});

const deleteDomain = asyncHandler(async (req, res) => {
  const domain = await Domain.findByPk(req.params.id);
  if (!domain) { res.status(404); throw new Error('Domain not found'); }
  await domain.update({ isActive: false });
  res.json({ success: true, message: 'Domain deactivated' });
});

// ────────────────────────────────────────────────────────────────────
// APPLICATIONS
// ────────────────────────────────────────────────────────────────────

const applyInternship = asyncHandler(async (req, res) => {
  const { domainId, phone, college, year, whyJoin } = req.body;

  const user = await User.findByPk(req.user.id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  // Check existing application
  const existing = await InternshipApplication.findOne({
    where: { userId: req.user.id, status: { [Op.in]: ['Pending', 'Approved'] } },
  });
  if (existing) { res.status(400); throw new Error('You already have an active application'); }

  const domain = await Domain.findByPk(domainId);
  if (!domain || !domain.isActive) { res.status(400); throw new Error('Domain not available'); }

  if (domain.filledSeats >= domain.totalSeats) {
    res.status(400); throw new Error('No seats available in this domain');
  }

  const application = await InternshipApplication.create({
    userId: req.user.id,
    domainId,
    studentName: user.name,
    email: user.email,
    phone, college, year, whyJoin,
    status: 'Pending',
  });

  res.status(201).json({ success: true, data: application, message: 'Application submitted! Admin will review soon.' });
});

const getMyApplication = asyncHandler(async (req, res) => {
  const application = await InternshipApplication.findOne({
    where: { userId: req.user.id },
    include: [{ model: Domain, as: 'domain' }],
    order: [['createdAt', 'DESC']],
  });

  let enrollment = null;
  if (application?.status === 'Approved') {
    enrollment = await InternshipEnrollment.findOne({
      where: { applicationId: application.id },
      include: [{ model: Domain, as: 'domain' }, { model: InternshipCertificate, as: 'certificate' }],
    });
  }

  res.json({ success: true, data: { application, enrollment } });
});

const getAllApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await InternshipApplication.findAndCountAll({
    where,
    include: [{ model: Domain, as: 'domain' }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, adminNote } = req.body;
  const application = await InternshipApplication.findByPk(req.params.id, {
    include: [{ model: Domain, as: 'domain' }],
  });
  if (!application) { res.status(404); throw new Error('Application not found'); }

  await application.update({ status, adminNote, approvedAt: status === 'Approved' ? new Date() : null });

  // Auto-create enrollment on approval
  if (status === 'Approved') {
    const existing = await InternshipEnrollment.findOne({ where: { applicationId: application.id } });
    if (!existing) {
      await InternshipEnrollment.create({
        applicationId: application.id,
        userId: application.userId,
        domainId: application.domainId,
        studentName: application.studentName,
        email: application.email,
        startDate: application.offerJoiningDate || new Date(),
        status: 'Active',
      });
      await application.domain.increment('filledSeats');
    }
  }

  res.json({ success: true, data: application, message: `Application ${status}` });
});

// ────────────────────────────────────────────────────────────────────
// RESOURCES
// ────────────────────────────────────────────────────────────────────

const getResources = asyncHandler(async (req, res) => {
  const { domainId } = req.query;
  const where = {};
  if (domainId) where.domainId = domainId;

  // Students only see resources for their enrolled domain
  if (req.user.role === 'student') {
    const enrollment = await InternshipEnrollment.findOne({
      where: { userId: req.user.id, status: { [Op.in]: ['Active', 'Completed'] } },
    });
    if (!enrollment) { res.status(403); throw new Error('You are not enrolled in any internship'); }
    where.domainId = enrollment.domainId;
  }

  const resources = await InternshipResource.findAll({
    where,
    include: [{ model: Domain, as: 'domain', attributes: ['name'] }],
    order: [['week', 'ASC'], ['createdAt', 'ASC']],
  });
  res.json({ success: true, data: resources });
});

const addResource = asyncHandler(async (req, res) => {
  const { domainId, title, type, url, description, week } = req.body;
  const resource = await InternshipResource.create({
    domainId, title, type, url, description, week,
    addedById: req.user.id,
  });
  res.status(201).json({ success: true, data: resource });
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await InternshipResource.findByPk(req.params.id);
  if (!resource) { res.status(404); throw new Error('Resource not found'); }
  await resource.destroy();
  res.json({ success: true, message: 'Resource deleted' });
});

// ────────────────────────────────────────────────────────────────────
// TRAINING PROGRESS
// ────────────────────────────────────────────────────────────────────

const getMyProgress = asyncHandler(async (req, res) => {
  const enrollment = await InternshipEnrollment.findOne({
    where: { userId: req.user.id },
    include: [
      { model: Domain, as: 'domain' },
      { model: InternshipCertificate, as: 'certificate' },
    ],
    order: [['createdAt', 'DESC']],
  });
  if (!enrollment) { res.status(404); throw new Error('No active enrollment found'); }

  const resources = await InternshipResource.findAll({ where: { domainId: enrollment.domainId }, order: [['week', 'ASC']] });
  res.json({ success: true, data: { enrollment, resources } });
});

const submitTask = asyncHandler(async (req, res) => {
  const { title, description, url, week } = req.body;

  const enrollment = await InternshipEnrollment.findOne({
    where: { userId: req.user.id, status: 'Active' },
  });
  if (!enrollment) { res.status(404); throw new Error('No active enrollment'); }

  const log = {
    id: Date.now().toString(),
    title, description, url, week: week || 1,
    submittedAt: new Date(),
    status: 'Submitted',
  };

  const logs = [...(enrollment.taskLogs || []), log];
  const totalResources = await InternshipResource.count({ where: { domainId: enrollment.domainId } });
  const progress = Math.min(95, Math.round((logs.length / Math.max(totalResources, 1)) * 100));

  await enrollment.update({ taskLogs: logs, progress });
  res.json({ success: true, data: enrollment, message: 'Task submitted successfully!' });
});

const markComplete = asyncHandler(async (req, res) => {
  const { adminRemark, lorPerformance, lorHighlights } = req.body;
  const enrollment = await InternshipEnrollment.findByPk(req.params.id, {
    include: [{ model: Domain, as: 'domain' }],
  });
  if (!enrollment) { res.status(404); throw new Error('Enrollment not found'); }

  await enrollment.update({
    status: 'Completed',
    progress: 100,
    completedAt: new Date(),
    adminRemark,
    lorPerformance: lorPerformance || 'Excellent',
    lorHighlights: lorHighlights || 'Demonstrated excellent skills and dedication.',
  });

  // Auto-generate certificate
  const existing = await InternshipCertificate.findOne({ where: { enrollmentId: enrollment.id } });
  if (!existing) {
    // Generate a secure, random 8-character ID (e.g., HRX-A1B2C3D4)
    const uniqueCertNo = 'HRX-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    await InternshipCertificate.create({
      enrollmentId: enrollment.id,
      studentName: enrollment.studentName,
      domainName: enrollment.domain?.name,
      certificateNo: uniqueCertNo,
    });
  }

  res.json({ success: true, message: 'Internship marked complete. Certificate generated!', data: enrollment });
});

// ────────────────────────────────────────────────────────────────────
// PDF GENERATORS
// ────────────────────────────────────────────────────────────────────

// Helper function to get exact absolute path for signature images
const getSignaturePath = (filename) => path.join(__dirname, '..', 'signatures', filename);

const COMPANY = {
  name:    'Hiresnix',
  tagline: 'Empowering Future Professionals',
  email:   'support@hiresnix.co.in',
  website: 'www.hiresnix.co.in',
  address: 'Pune, Maharashtra, India',
  colors: {
    accent: '#d4af37',    // Gold (used for borders, stars, dividers)
    primary: '#1e40af',   // Deep Blue (used for the domain name text)
    highlight: '#60a5fa', // Light Blue (used for header text)
  }
};

const DOMAIN_DURATION_MONTHS = {
  'ui/ux design': 1,
  'frontend development': 2,
  'backend development': 2,
  'full stack development': 3,
  'python development': 2,
  'data science': 3,
  'digital marketing': 1,
  'qa testing': 1,
};

function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateOnly(value) {
  const date = value instanceof Date ? value : parseDateOnly(value);
  if (!date) return '';
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function toIsoDateOnly(value) {
  const date = value instanceof Date ? value : parseDateOnly(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addMonths(date, months) {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + months);
  if (next.getDate() !== day) next.setDate(0);
  return next;
}

function normalizeDomainName(value) {
  return String(value || '')
    .replace(/\bintern(ship)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getDomainDurationMonths(domainName) {
  const normalized = normalizeDomainName(domainName);
  return DOMAIN_DURATION_MONTHS[normalized] || null;
}

let offerDateColumnsReady = false;
async function ensureOfferDateColumns() {
  if (offerDateColumnsReady) return;
  try {
    const columns = await sequelize.getQueryInterface().describeTable('ip_applications');
    if (!columns.offerLetterId) {
      await sequelize.getQueryInterface().addColumn('ip_applications', 'offerLetterId', {
        type: DataTypes.STRING(50),
        allowNull: true,
      });
    }
    if (!columns.offerLetterDate) {
      await sequelize.getQueryInterface().addColumn('ip_applications', 'offerLetterDate', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
    }
    if (!columns.offerJoiningDate) {
      await sequelize.getQueryInterface().addColumn('ip_applications', 'offerJoiningDate', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
    }
    if (!columns.offerEndDate) {
      await sequelize.getQueryInterface().addColumn('ip_applications', 'offerEndDate', {
        type: DataTypes.DATEONLY,
        allowNull: true,
      });
    }
    offerDateColumnsReady = true;
  } catch (err) {
    console.error('Unable to ensure offer date columns:', err.message);
    throw err;
  }
}

function calculateDurationLabel(startDate, endDate) {
  if (!startDate || !endDate) return 'the stipulated duration';

  let months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  let anchor = addMonths(startDate, months);
  if (anchor > endDate) {
    months -= 1;
    anchor = addMonths(startDate, months);
  }

  const days = Math.max(0, Math.round((endDate - anchor) / (24 * 60 * 60 * 1000)));
  const roundedMonths = Math.max(1, months + (days >= 15 ? 1 : 0));
  return `${roundedMonths} Month${roundedMonths === 1 ? '' : 's'}`;
}

function durationMonthsFromLabel(value) {
  if (!value) return null;
  const label = String(value).trim();
  const monthMatch = label.match(/(\d+)\s*months?/i);
  if (monthMatch) return Number(monthMatch[1]);
  const weekMatch = label.match(/(\d+)\s*weeks?/i);
  if (weekMatch) return Math.max(1, Math.round(Number(weekMatch[1]) / 4));
  return null;
}

function cleanInternDomain(value) {
  return String(value || 'Technology')
    .replace(/\bintern(ship)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Technology';
}

function drawOfferSeal(doc, x, y) {
  doc.save();
  doc.lineWidth(1.5).strokeColor(COMPANY.colors.accent).strokeOpacity(0.85);
  doc.circle(x, y, 40).stroke();
  doc.circle(x, y, 36).stroke();
  doc.lineWidth(0.5);
  doc.circle(x, y, 26).stroke();

  doc.fillColor(COMPANY.colors.accent).fillOpacity(0.85);
  doc.fontSize(10).font('Helvetica-Bold')
    .text('HIRESNIX', x - 40, y - 10, { width: 80, align: 'center' });
  doc.fontSize(7).font('Helvetica')
    .text('COMPANY SEAL', x - 40, y + 4, { width: 80, align: 'center' });
  doc.restore();
}

function pdfHeader(doc, title) {
  // Background stripe
  doc.rect(0, 0, doc.page.width, 120).fill('#0f172a');

  // Company name
  doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold')
     .text(COMPANY.name, 40, 30);
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
     .text(COMPANY.tagline, 40, 62);

  // Document title on right
  doc.fillColor(COMPANY.colors.highlight).fontSize(14).font('Helvetica-Bold')
     .text(title, 0, 45, { align: 'right', width: doc.page.width - 40 });

  doc.fillColor('#000000');
  doc.y = 140;
}

function pdfFooter(doc) {
  const bottom = doc.page.height - 60;
  doc.rect(0, bottom - 10, doc.page.width, 70).fill('#0f172a');
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
     .text(`${COMPANY.email}  |  ${COMPANY.website}  |  ${COMPANY.address}`,
       0, bottom + 5, { align: 'center' });
}

function signatureLine(doc, name, title, x, y, imagePath = null, sizeMultiplier = 1) {
  if (imagePath) {
    try {
      if (!fs.existsSync(imagePath)) {
        console.error(`[ERROR] Signature file MISSING on server: ${imagePath}`);
      } else {
        const boxW = 100 * sizeMultiplier;
        const boxH = 40 * sizeMultiplier;
        const xOffset = (160 - boxW) / 2;
        const yOffset = boxH - 12; // Overlap the line slightly like a real signature
        
        doc.image(imagePath, x + xOffset, y - yOffset, { fit: [boxW, boxH], align: 'center' });
      }
    } catch (err) {
      // Silently ignore if image is missing so the PDF still generates safely
      console.error(`Signature image load karne me error (${imagePath}):`, err.message);
    }
  }
  doc.moveTo(x, y).lineTo(x + 160, y).stroke('#334155');
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold')
     .text(name, x, y + 6, { width: 160, align: 'center' });
  doc.fillColor('#64748b').fontSize(9).font('Helvetica')
     .text(title, x, y + 20, { width: 160, align: 'center' });
}

// Helper to flexibly find an enrollment whether an Enrollment ID, Certificate ID, or Certificate No is passed
async function resolveEnrollment(identifier, includes = []) {
  let enrollment = null;
  if (!identifier || identifier === 'undefined') return null;
  try { enrollment = await InternshipEnrollment.findByPk(identifier, { include: includes }); } catch (e) {}
  if (!enrollment) {
    try {
      const cert = await InternshipCertificate.findOne({ where: { certificateNo: identifier } });
      if (cert && cert.enrollmentId) enrollment = await InternshipEnrollment.findByPk(cert.enrollmentId, { include: includes });
    } catch (e) {}
  }
  if (!enrollment) {
    try {
      const cert = await InternshipCertificate.findByPk(identifier);
      if (cert && cert.enrollmentId) enrollment = await InternshipEnrollment.findByPk(cert.enrollmentId, { include: includes });
    } catch (e) {}
  }
  return enrollment;
}

const downloadCertificate = asyncHandler(async (req, res) => {
  const identifier = req.params.enrollId || req.params.id || req.params.certId;
  const enrollment = await resolveEnrollment(identifier, [
    { model: Domain, as: 'domain' }, 
    { model: InternshipCertificate, as: 'certificate' }
  ]);
  if (!enrollment || enrollment.status !== 'Completed') {
    res.status(404); throw new Error('Certificate not available');
  }
  if (req.user.role === 'student' && enrollment.userId !== req.user.id) {
    res.status(403); throw new Error('Not authorized');
  }

  const cert = enrollment.certificate;
  const safeStudentName = enrollment.studentName || 'Student';
  const issueDate = cert?.issuedAt
    ? new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${safeStudentName}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const H = doc.page.height;

  // Accent border
  doc.rect(20, 20, W - 40, H - 40).lineWidth(3).stroke(COMPANY.colors.accent);
  doc.rect(26, 26, W - 52, H - 52).lineWidth(1).stroke(COMPANY.colors.accent);

  // Header background
  doc.rect(20, 20, W - 40, 90).fill('#0f172a');

  // Company name
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
     .text(COMPANY.name, 50, 35);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
     .text(COMPANY.tagline, 50, 62);
  doc.fillColor(COMPANY.colors.highlight).fontSize(11).font('Helvetica-Bold')
     .text('CERTIFICATE OF COMPLETION', 0, 52, { align: 'right', width: W - 50 });

  // Accent diamond decorations
  doc.fillColor(COMPANY.colors.accent);
  const drawDiamond = (x, y, size) => {
    doc.moveTo(x, y - size).lineTo(x + size, y).lineTo(x, y + size).lineTo(x - size, y).fill();
  };
  drawDiamond(35, 70, 6);
  drawDiamond(W - 35, 70, 6);

  // Title
  doc.fillColor('#0f172a').fontSize(36).font('Helvetica-Bold')
     .text('Certificate of Completion', 0, 135, { align: 'center' });

  // Divider
  doc.rect(W / 2 - 100, 185, 200, 2).fill(COMPANY.colors.accent);

  // Body
  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text('This is to certify that', 0, 205, { align: 'center' });

  doc.fillColor('#0f172a').fontSize(28).font('Helvetica-Bold')
     .text(safeStudentName, 0, 230, { align: 'center' });

  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text('has successfully completed the internship program in', 0, 275, { align: 'center' });

  doc.fillColor(COMPANY.colors.primary).fontSize(20).font('Helvetica-Bold')
     .text(enrollment.domain?.name || 'Technology', 0, 300, { align: 'center' });

  doc.fillColor('#475569').fontSize(12).font('Helvetica')
     .text(`at ${COMPANY.name} | Issued on ${issueDate}`, 0, 335, { align: 'center' });

  if (cert?.certificateNo) {
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
       .text(`Certificate No: ${cert.certificateNo}`, 0, 358, { align: 'center' });
  }

  // QR Code for Verification
  try {
    const verifyUrl = `${getFrontendUrl()}/verify/${cert?.certificateNo || `CERT-${enrollment.id}`}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { errorCorrectionLevel: 'H', margin: 1 });
    const qrSize = 65;
    const qrX = (W / 2) - (qrSize / 2);
    const qrY = H - 145;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize });
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
       .text('Scan to Verify', qrX, qrY + qrSize + 4, { width: qrSize, align: 'center' });
  } catch (err) {
    console.error('Failed to generate QR Code:', err.message);
  }

  // Signature lines
  signatureLine(doc, 'Mr.Jayesh Badgujar', 'Program Director', (W / 2) - 260, H - 125, getSignaturePath('Director.png'), 1.6);
  signatureLine(doc, 'Mr.A S Borse', `Founder & CEO, ${COMPANY.name}`, (W / 2) + 100, H - 125, getSignaturePath('ceo.png'), 1.6);

  // Footer
  doc.rect(20, H - 60, W - 40, 40).fill('#0f172a');
  doc.fillColor('#94a3b8').fontSize(8)
     .text(`${COMPANY.email}  |  ${COMPANY.website}  |  ${COMPANY.address}`, 0, H - 47, { align: 'center' });

  doc.end();
});

const downloadCompletionLetter = asyncHandler(async (req, res) => {
  const identifier = req.params.enrollId || req.params.id;
  const enrollment = await resolveEnrollment(identifier, [
    { model: Domain, as: 'domain' }
  ]);
  if (!enrollment || enrollment.status !== 'Completed') {
    res.status(404); throw new Error('Completion letter not available');
  }
  if (req.user.role === 'student' && enrollment.userId !== req.user.id) {
    res.status(403); throw new Error('Not authorized');
  }

  const safeStudentName = enrollment.studentName || 'Student';
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="completion-letter-${safeStudentName}.pdf"`);
  doc.pipe(res);

  pdfHeader(doc, 'INTERNSHIP COMPLETION LETTER');

  // Safe date parsing to prevent PDFKit from crashing if a DB date is empty/invalid
  const parseDate = (val) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const date = parseDate(enrollment.completedAt || Date.now())
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const startDate = parseDate(enrollment.startDate || enrollment.createdAt)
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.moveDown(1);
  doc.fillColor('#475569').fontSize(11).font('Helvetica').text(`Date: ${date}`, 40);
  doc.moveDown(0.5);
  doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('To Whomsoever It May Concern,', 40);
  doc.moveDown(1);

  doc.fillColor('#334155').fontSize(11).font('Helvetica').text(
    `This is to certify that ${safeStudentName} has successfully completed the Internship Program in ` +
    `${enrollment.domain?.name || 'Technology'} at ${COMPANY.name}.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(1);
  doc.text(
    `The internship commenced on ${startDate} and was completed on ${date}. ` +
    `During this period, the intern demonstrated commitment to learning, ` +
    `completed all assigned tasks and projects, and adhered to organizational guidelines.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(1);
  if (enrollment.adminRemark) {
    doc.text(enrollment.adminRemark, 40, doc.y, { width: 515, align: 'justify' });
    doc.moveDown(1);
  }
  doc.text(
    `We wish ${safeStudentName} all the best in their future endeavors.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(2);
  doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Yours sincerely,', 40);
  doc.moveDown(2.5); // Give a bit more space for the signatures
  const sigY = doc.y;
  const W = doc.page.width;
  signatureLine(doc, 'Mr.Jayesh Badgujar', 'Program Director', 40, sigY, getSignaturePath('Director.png'), 1.0);
  signatureLine(doc, 'Mr.A S Borse' , `Founder & CEO, ${COMPANY.name}`, W - 200, sigY, getSignaturePath('ceo.png'), 1.6);

  pdfFooter(doc);
  doc.end();
});

const downloadLOR = asyncHandler(async (req, res) => {
  const identifier = req.params.enrollId || req.params.id;
  const enrollment = await resolveEnrollment(identifier, [
    { model: Domain, as: 'domain' }
  ]);
  if (!enrollment || enrollment.status !== 'Completed') {
    res.status(404); throw new Error('LOR not available');
  }
  if (req.user.role === 'student' && enrollment.userId !== req.user.id) {
    res.status(403); throw new Error('Not authorized');
  }

  const safeStudentName = enrollment.studentName || 'Student';
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="lor-${safeStudentName}.pdf"`);
  doc.pipe(res);

  pdfHeader(doc, 'LETTER OF RECOMMENDATION');

  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const performance = enrollment.lorPerformance || 'Excellent';
  const highlights = enrollment.lorHighlights || 'demonstrated strong problem-solving skills and a commitment to excellence';

  doc.moveDown(1);
  doc.fillColor('#475569').fontSize(11).font('Helvetica').text(`Date: ${date}`, 40);
  doc.moveDown(0.5);
  doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text('To Whomsoever It May Concern,', 40);
  doc.moveDown(0.5);
  doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold')
     .text(`Re: Letter of Recommendation for ${safeStudentName}`, 40);
  doc.moveDown(1);

  doc.fillColor('#334155').fontSize(11).font('Helvetica').text(
    `I am pleased to write this letter of recommendation for ${safeStudentName}, ` +
    `who completed an internship in ${enrollment.domain?.name || 'Technology'} at ${COMPANY.name}.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(1);
  doc.text(
    `During the internship, ${safeStudentName} showed ${performance.toLowerCase()} performance and ` +
    `${highlights}. Their dedication, technical aptitude, and eagerness to learn were commendable.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(1);
  doc.text(
    `I strongly recommend ${safeStudentName} for any professional opportunity or academic program. ` +
    `They would be a valuable addition to any team or institution.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(1);
  doc.text(
    `Please feel free to contact us at ${COMPANY.email} for any further information.`,
    40, doc.y, { width: 515, align: 'justify' }
  );
  doc.moveDown(2);
  doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('Sincerely,', 40);
  doc.moveDown(2.5); // Give a bit more space for the signatures
  const sigY = doc.y;
  const W = doc.page.width;
  signatureLine(doc, 'Mr.Jayesh Badgujar' , 'Program Director', 40, sigY, getSignaturePath('Director.png'), 1.6);
  signatureLine(doc, 'Mr.A S Borse' , `Founder & CEO, ${COMPANY.name}`, W - 200, sigY, getSignaturePath('ceo.png'), 1.6);

  pdfFooter(doc);
  doc.end();
});

const generateOfferLetter = asyncHandler(async (req, res) => {
  const { applicationId, candidateName, role, duration, joiningDate, endDate, offerLetterDate } = req.body;
  const safeCandidateName = String(candidateName || 'Candidate').trim() || 'Candidate';
  const fileCandidateName = safeCandidateName.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'candidate';

  await ensureOfferDateColumns();

  let application = null;
  if (applicationId) {
    application = await InternshipApplication.findByPk(applicationId, {
      include: [{ model: Domain, as: 'domain' }],
    });
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const stableOfferDate = application?.offerLetterDate || offerLetterDate || todayIso;
  const stableJoiningDate = application?.offerJoiningDate || joiningDate;
  if (!stableJoiningDate) {
    res.status(400);
    throw new Error('Joining Date is required');
  }
  const stableOfferId = application?.offerLetterId || `HSN-INT-${new Date(stableOfferDate).getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const offerDateObj = parseDateOnly(stableOfferDate);
  const startDateObj = parseDateOnly(stableJoiningDate);
  if (!offerDateObj) {
    res.status(400);
    throw new Error('Offer Letter Date is invalid');
  }
  if (!startDateObj) {
    res.status(400);
    throw new Error('Joining Date is invalid');
  }
  const stableEndDate = application?.offerEndDate || endDate;
  const manualEndDateObj = parseDateOnly(stableEndDate);
  if (stableEndDate && !manualEndDateObj) {
    res.status(400);
    throw new Error('End Date is invalid');
  }
  if (manualEndDateObj && manualEndDateObj < startDateObj) {
    res.status(400);
    throw new Error('End Date cannot be before Joining Date');
  }
  const domainName = cleanInternDomain(application?.domain?.name || role || 'Technology');
  const mappedMonths = getDomainDurationMonths(domainName);
  const durationMonths = mappedMonths || durationMonthsFromLabel(duration || application?.domain?.duration);
  const endDateObj = manualEndDateObj || (durationMonths ? addMonths(startDateObj, durationMonths) : null);
  if (!endDateObj) {
    res.status(400);
    throw new Error('End Date is required when domain duration cannot be determined');
  }
  const internshipDuration = manualEndDateObj
    ? calculateDurationLabel(startDateObj, endDateObj)
    : (durationMonths ? `${durationMonths} Month${durationMonths === 1 ? '' : 's'}` : (duration || 'the stipulated duration'));
  const joinDateStr = formatDateOnly(startDateObj);
  const endDateStr = formatDateOnly(endDateObj);

  if (application && (!application.offerLetterDate || !application.offerJoiningDate || !application.offerLetterId || !application.offerEndDate)) {
    const offerUpdate = {
      offerLetterDate: application.offerLetterDate || stableOfferDate,
      offerJoiningDate: application.offerJoiningDate || stableJoiningDate,
      offerLetterId: application.offerLetterId || stableOfferId,
      offerEndDate: application.offerEndDate || toIsoDateOnly(endDateObj),
    };
    await application.update(offerUpdate);
  }

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="offer-letter-${fileCandidateName}.pdf"`);
  doc.pipe(res);

  const dateStr = formatDateOnly(stableOfferDate);
  const bullet = String.fromCharCode(8226);
  const left = 40;
  const bodyWidth = 515;

  const drawSimpleHeader = (title, withTagline = false) => {
    doc.fillColor('#0f172a').fontSize(26).font('Helvetica-Bold')
      .text('HIRESNIX', 0, 42, { align: 'center' });
    if (withTagline) {
      doc.fillColor('#475569').fontSize(11).font('Helvetica')
        .text('Empowering Future Professionals', 0, 72, { align: 'center' });
    }
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold')
      .text(title, 0, withTagline ? 118 : 92, { align: 'center' });
    doc.y = withTagline ? 160 : 130;
  };

  const paragraph = (text, options = {}) => {
    doc.fillColor('#334155').fontSize(options.size || 10).font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(text, left, doc.y, { width: bodyWidth, align: options.align || 'justify', lineGap: options.lineGap ?? 2 });
  };

  const bulletList = (items) => {
    items.forEach(item => {
      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(`${bullet} ${item}`, left + 20, doc.y, { width: bodyWidth - 20, lineGap: 1 });
    });
  };

  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1.5).stroke(COMPANY.colors.accent);
  drawSimpleHeader('INTERNSHIP OFFER LETTER', true);

  doc.fillColor('#475569').fontSize(10).font('Helvetica')
    .text(`Offer Letter ID: ${stableOfferId}`, left, doc.y);
  doc.moveDown(0.25);
  doc.text(`Date: ${dateStr}`, left, doc.y);

  doc.moveDown(1);
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text('To,', left);
  doc.font('Helvetica-Bold').text(safeCandidateName, left);

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold')
    .text(`Subject: Internship Offer Letter - ${domainName} Intern - Hiresnix`, left, doc.y, { width: bodyWidth });

  doc.moveDown(0.8);
  doc.font('Helvetica').text(`Dear ${safeCandidateName},`, left);
  doc.moveDown(0.45);
  doc.font('Helvetica-Bold').text('Congratulations!', left);
  doc.moveDown(0.45);
  paragraph(`We are pleased to offer you the position of ${domainName} Intern at Hiresnix.`);

  doc.moveDown(0.55);
  paragraph('Your internship details are as follows:', { align: 'left' });
  doc.moveDown(0.55);
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('INTERNSHIP DETAILS', left);
  doc.moveDown(0.35);
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
    .text(`Start Date: ${joinDateStr}`, left, doc.y)
    .text(`End Date: ${endDateStr}`, left, doc.y)
    .text(`Duration: ${internshipDuration}`, left, doc.y)
    .text('Mode of Internship: Remote', left, doc.y);

  doc.moveDown(0.75);
  paragraph('Hiresnix is committed to helping students and early professionals gain practical industry experience through project-based learning, mentorship, and skill development.');

  doc.moveDown(0.65);
  paragraph('During the internship, you will have the opportunity to:', { align: 'left' });
  doc.moveDown(0.25);
  bulletList([
    'Work on real-world projects',
    'Gain hands-on industry experience',
    'Learn through practical assignments',
    'Receive mentorship and guidance',
    'Build professional and technical skills',
    'Enhance problem-solving and communication abilities',
  ]);

  doc.moveDown(0.65);
  paragraph('Outstanding interns may be considered for future opportunities based on company requirements and performance evaluation.');
  doc.moveDown(0.65);
  paragraph('We look forward to supporting your professional growth and learning journey through Hiresnix.');

  doc.addPage({ size: 'A4', margin: 0 });
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1.5).stroke(COMPANY.colors.accent);
  drawSimpleHeader('INTERNSHIP TERMS & ACKNOWLEDGEMENT');

  paragraph('Upon successful completion of the internship and satisfactory performance evaluation, interns may be eligible to receive:');
  doc.moveDown(0.3);
  bulletList([
    'Internship Completion Certificate',
    'Letter of Recommendation (subject to company evaluation)',
  ]);

  doc.moveDown(0.9);
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Intern Responsibilities', left);
  doc.moveDown(0.35);
  bulletList([
    'Maintain professional conduct throughout the internship',
    'Complete assigned tasks within agreed timelines',
    'Participate actively in assigned projects',
    'Follow company communication and work guidelines',
  ]);

  doc.moveDown(0.9);
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Internship Guidelines', left);
  doc.moveDown(0.35);
  bulletList([
    'Maintain regular communication with mentors',
    'Submit assigned work within specified timelines',
    'Follow ethical and professional work practices',
    'Respect project confidentiality and company resources',
  ]);

  doc.moveDown(0.9);
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Acceptance', left);
  doc.moveDown(0.35);
  paragraph('Please confirm your acceptance of this offer by replying to this email/message.');

  doc.moveDown(0.9);
  paragraph('For verification or queries:', { align: 'left' });
  doc.moveDown(0.2);
  doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text('hr@hiresnix.co.in', left);

  doc.moveDown(1.15);
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Regards,', left);

  const sigY = doc.y + 8;
  const signatureTextY = sigY + 44;
  try {
    doc.image(getSignaturePath('ceo.png'), left, sigY, { fit: [120, 48] });
  } catch (err) {}
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold')
    .text('A S Borse', left, signatureTextY, { lineGap: 0 });
  doc.fillColor('#334155').fontSize(9).font('Helvetica')
    .text('Founder', left, signatureTextY + 12, { lineGap: 0 })
    .text('Hiresnix', left, signatureTextY + 24, { lineGap: 0 });

  drawOfferSeal(doc, doc.page.width - 105, sigY + 34);

  doc.fillColor('#334155').fontSize(9).font('Helvetica')
    .text('support@hiresnix.co.in', left, signatureTextY + 42, { lineGap: 0 })
    .text('www.hiresnix.co.in', left, signatureTextY + 54, { lineGap: 0 })
    .text('Pune, Maharashtra, India', left, signatureTextY + 66, { lineGap: 0 });

  doc.end();
  return;

  pdfHeader(doc, 'INTERNSHIP OFFER LETTER');

  const legacyDateStr = formatDateOnly(stableOfferDate);

  doc.moveDown(1);
  doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`Offer Letter ID: ${stableOfferId}`, 40);
  doc.moveDown(0.2);
  doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`Date: ${legacyDateStr}`, 40);
  
  doc.moveDown(1);
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text('To,', 40);
  doc.font('Helvetica-Bold').text(safeCandidateName, 40);

  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').text(`Subject: Internship Offer Letter – ${role || 'Intern'} – Hiresnix`, 40);

  doc.moveDown(0.8);
  doc.font('Helvetica').text(`Dear ${safeCandidateName},`, 40);

  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').text('Congratulations!', 40);

  doc.moveDown(0.4);
  doc.fillColor('#334155').font('Helvetica').text(
    `We are pleased to offer you the position of ${role || 'Intern'} at Hiresnix.`,
    40, doc.y, { width: 515, align: 'justify' }
  );

  doc.moveDown(0.4);
  doc.text('Your internship will be conducted remotely and is scheduled as follows:', 40, doc.y, { width: 515, align: 'justify' });

  doc.moveDown(0.4);
  doc.fillColor('#1e293b').font('Helvetica-Bold').text('Internship Details', 40, doc.y);
  doc.moveDown(0.2);
  doc.fillColor('#334155').font('Helvetica')
    .text(`Start Date: ${joinDateStr}`, 60, doc.y)
    .text(`End Date: ${endDateStr || 'To be confirmed'}`, 60, doc.y)
    .text(`Internship Duration: ${internshipDuration}`, 60, doc.y)
    .text('Internship Mode: Remote', 60, doc.y);

  doc.moveDown(0.4);
  doc.text(
    `This internship is designed to provide practical industry exposure, project-based learning, mentorship, and skill development opportunities.`,
    40, doc.y, { width: 515, align: 'justify' }
  );

  doc.moveDown(0.4);
  doc.text('During the internship, you will receive:', 40, doc.y);
  doc.moveDown(0.2);
  ['Hands-on project experience', 'Practical training and mentorship', 'Task-based learning', 'Performance evaluation', 'Career guidance and support']
    .forEach(item => doc.text(`•  ${item}`, 60, doc.y));

  doc.moveDown(0.4);
  doc.text(
    `Candidates demonstrating strong performance, professionalism, consistency, and meaningful project contribution may be considered for future opportunities and recommendations based on company evaluation criteria.`,
    40, doc.y, { width: 515, align: 'justify' }
  );

  doc.moveDown(0.4);
  doc.text('Upon successful completion of the internship and satisfactory performance evaluation, you may receive:', 40, doc.y);
  doc.moveDown(0.2);
  ['Internship Completion Certificate', 'Letter of Recommendation (LOR)', 'Training Certificate', 'Skill Assessment Report (if applicable)']
    .forEach(item => doc.text(`•  ${item}`, 60, doc.y));

  doc.moveDown(0.4);
  doc.text('Interns are expected to:', 40, doc.y);
  doc.moveDown(0.2);
  ['Maintain professionalism', 'Complete assigned tasks on time', 'Participate actively throughout the internship', 'Follow company guidelines and policies']
    .forEach(item => doc.text(`${String.fromCharCode(8226)}  ${item}`, 60, doc.y));

  doc.moveDown(0.4);
  doc.fillColor('#1e293b').font('Helvetica-Bold').text('Stipend', 40, doc.y);
  doc.moveDown(0.2);
  doc.fillColor('#334155').font('Helvetica').text(
    `This is an unpaid internship focused on practical learning, industry exposure, and skill development.`,
    40, doc.y, { width: 515, align: 'justify' }
  );

  doc.moveDown(0.4);
  doc.fillColor('#1e293b').font('Helvetica-Bold').text('Acceptance', 40, doc.y);
  doc.moveDown(0.2);
  doc.fillColor('#334155').font('Helvetica').text(`Please confirm your acceptance of this offer by replying to this email/message.`, 40, doc.y, { width: 515, align: 'justify' });

  doc.moveDown(0.8);
  doc.fillColor('#1e293b').font('Helvetica-Bold').text('Regards,', 40, doc.y);
  doc.moveDown(0.5);

  const legacySigY = Math.min(doc.y, doc.page.height - 180);
  try {
    doc.image(getSignaturePath('ceo.png'), 40, legacySigY, { fit: [120, 48] });
  } catch (err) {}

  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('A S Borse', 40, legacySigY + 50);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica')
     .text('Founder', 40, legacySigY + 65)
     .text('Hiresnix', 40, legacySigY + 78)
     .text('hr@hiresnix.co.in', 40, legacySigY + 91);

  // Official Company Stamp / Symbol
  const stampX = doc.page.width - 100;
  const stampY = legacySigY + 25;
  
  doc.save();
  doc.lineWidth(1.5).strokeColor(COMPANY.colors.accent).strokeOpacity(0.8);
  doc.circle(stampX, stampY, 40).stroke();
  doc.circle(stampX, stampY, 36).stroke();
  doc.lineWidth(0.5);
  doc.circle(stampX, stampY, 26).stroke();
  
  doc.fillColor(COMPANY.colors.accent).fillOpacity(0.8);
  doc.fontSize(10).font('Helvetica-Bold')
     .text('HIRESNIX', stampX - 40, stampY - 10, { width: 80, align: 'center' });
  doc.fontSize(7).font('Helvetica')
     .text('OFFICIAL SEAL', stampX - 40, stampY + 4, { width: 80, align: 'center' });
  doc.restore();

  pdfFooter(doc);
  
  // Add the outer border to the letter
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(2).stroke(COMPANY.colors.accent);

  doc.end();
});

// ────────────────────────────────────────────────────────────────────
// ADMIN STATS
// ────────────────────────────────────────────────────────────────────

const getStats = asyncHandler(async (req, res) => {
  const [totalApplications, pendingApplications, activeEnrollments, completedEnrollments, totalDomains] =
    await Promise.all([
      InternshipApplication.count(),
      InternshipApplication.count({ where: { status: 'Pending' } }),
      InternshipEnrollment.count({ where: { status: 'Active' } }),
      InternshipEnrollment.count({ where: { status: 'Completed' } }),
      Domain.count({ where: { isActive: true } }),
    ]);

  res.json({
    success: true,
    data: { totalApplications, pendingApplications, activeEnrollments, completedEnrollments, totalDomains },
  });
});

const getEnrolledStudents = asyncHandler(async (req, res) => {
  const { domainId, status } = req.query;
  const where = {};
  if (domainId) where.domainId = domainId;
  if (status) where.status = status;

  const enrollments = await InternshipEnrollment.findAll({
    where,
    include: [{ model: Domain, as: 'domain' }, { model: InternshipCertificate, as: 'certificate' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, count: enrollments.length, data: enrollments });
});

const getAllEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await InternshipEnrollment.findAll({
    include: [{ model: Domain, as: 'domain' }, { model: InternshipCertificate, as: 'certificate' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: enrollments });
});

const getMyCertificates = asyncHandler(async (req, res) => {
  const enrollments = await InternshipEnrollment.findAll({
    where: { userId: req.user.id, status: 'Completed' },
    include: [{ model: Domain, as: 'domain' }, { model: InternshipCertificate, as: 'certificate' }],
  });

  // Auto-patch missing certificate IDs for older records
  for (let e of enrollments) {
    if (e.certificate && !e.certificate.certificateNo) {
      e.certificate.certificateNo = 'HRX-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      try { await e.certificate.save(); } catch(err) {}
    }
  }

  res.json({ success: true, data: enrollments });
});

// ────────────────────────────────────────────────────────────────────
// PUBLIC VERIFICATION
// ────────────────────────────────────────────────────────────────────

const verifyCertificate = asyncHandler(async (req, res) => {
  const certId = (req.params.certId || '').trim();
  if (!certId) {
    res.status(400); throw new Error('Certificate ID is required');
  }
  
  let cert = null;
  
  // 1. Try searching by certificateNo
  try {
    cert = await InternshipCertificate.findOne({ where: { certificateNo: certId } });
  } catch(e) {
    console.error('[DB ERROR] Missing certificateNo column in DB?', e.message);
  }
  
  // 2. Case-insensitive search on certificateNo (handles lowercase typos safely)
  if (!cert) {
    try {
      cert = await InternshipCertificate.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('certificateNo')),
          certId.toLowerCase()
        ),
      });
    } catch(e) {}
  }
  
  // 3. Try searching by primary key only when the provided value is a numeric DB ID
  if (!cert && /^\d+$/.test(certId)) {
    try { cert = await InternshipCertificate.findByPk(certId); } catch(e) {}
  }

  // 4. Fallback: If frontend generated a dummy CERT-ID based on primary key
  if (!cert && /^CERT-\d+$/i.test(certId)) {
    const internalId = certId.replace(/^CERT-/i, '');
    try { cert = await InternshipCertificate.findByPk(internalId); } catch(e) {}
  }

  if (!cert) {
    res.status(404); throw new Error('Certificate not found or invalid');
  }

  res.json({
    success: true,
    valid: cert.isValid,
    data: cert
  });
});

// ────────────────────────────────────────────────────────────────────
// PASSWORD RESET
// ────────────────────────────────────────────────────────────────────

const resetTokens = new Map(); // In production use Redis or DB

const getFrontendUrl = () => (
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  process.env.VITE_FRONTEND_URL ||
  'https://www.hiresnix.co.in'
).replace(/\/$/, '');

function createMailTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return null;
}

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.json({ success: true, message: 'If email exists, reset link sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  resetTokens.set(token, { userId: user.id, expires: Date.now() + 15 * 60 * 1000 });

  const clientUrl = (process.env.RESET_PASSWORD_URL || getFrontendUrl()).replace(/\/$/, '');
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;
  const transporter = createMailTransporter();

  if (!transporter) {
    console.error('Password reset email is not configured. Set EMAIL_USER and EMAIL_PASS, or SMTP_HOST credentials.');
    res.status(500);
    throw new Error('Password reset email is not configured');
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Hiresnix" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Reset your Hiresnix password',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2>Password reset request</h2>
        <p>Hello ${user.name || 'there'},</p>
        <p>Click the button below to reset your Hiresnix password. This link expires in 15 minutes.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700">
            Reset password
          </a>
        </p>
        <p>If the button does not work, open this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  res.json({ success: true, message: 'Reset link sent to your email.', devToken: process.env.NODE_ENV === 'development' ? token : undefined });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const record = resetTokens.get(token);
  if (!record || Date.now() > record.expires) {
    res.status(400); throw new Error('Invalid or expired reset token');
  }
  const user = await User.findByPk(record.userId);
  user.password = newPassword; // bcrypt hook will hash it
  await user.save();
  resetTokens.delete(token);
  res.json({ success: true, message: 'Password reset successful. Please login.' });
});

module.exports = {
  getDomains, createDomain, deleteDomain,
  applyInternship, getMyApplication, getAllApplications, updateApplicationStatus,
  getResources, addResource, deleteResource,
  getMyProgress, submitTask, markComplete,
  getMyCertificates, downloadCertificate, downloadCompletionLetter, downloadLOR,
  generateOfferLetter,
  getStats, getEnrolledStudents, getAllEnrollments,
  verifyCertificate,
  forgotPassword, resetPassword,
};
