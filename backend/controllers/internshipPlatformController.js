/**
 * controllers/internshipPlatformController.js
 *
 * Install extra deps:
 *   npm install pdfkit qrcode
 */

const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { Op, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
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

  // Check if this is an institution student (via x-inst-student-id header)
  const instStudentId   = req.headers['x-inst-student-id'] || null;
  const institutionId   = req.headers['x-institution-id'] || null;
  const institutionName = req.headers['x-institution-name'] || null;
  const source = instStudentId ? 'institution' : 'hiresnix';

  const application = await InternshipApplication.create({
    userId: req.user.id,
    domainId,
    studentName: user.name,
    email: user.email,
    phone, college, year, whyJoin,
    status: 'Pending',
    source,
    instStudentId: instStudentId ? parseInt(instStudentId) : null,
    institutionId: institutionId ? parseInt(institutionId) : null,
    institutionName: institutionName || null,
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
  const { status, page = 1, limit, source } = req.query;
  const where = {};
  if (status) where.status = status;
  if (source) where.source = source; // 'hiresnix' | 'institution'

  const query = {
    where,
    include: [{ model: Domain, as: 'domain' }],
    order: [['createdAt', 'DESC']],
  };

  // The admin screen currently renders one complete list. Only paginate when a
  // caller explicitly supplies a limit; the previous implicit limit of 20 made
  // the list disagree with the total returned by the stats endpoint.
  if (limit !== undefined) {
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 20);
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    query.limit = parsedLimit;
    query.offset = (parsedPage - 1) * parsedLimit;
  }

  const { count, rows } = await InternshipApplication.findAndCountAll(query);
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
  address: 'Shirpur, Maharashtra, India',
  colors: {
    accent: '#d4af37',    // Gold (used for borders, stars, dividers)
    primary: '#1e40af',   // Deep Blue (used for the domain name text)
    highlight: '#60a5fa', // Light Blue (used for header text)
  }
};

const DEFAULT_FRONTEND_URL = 'https://hiresnix.co.in';
const getFrontendUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL || DEFAULT_FRONTEND_URL).replace(/\/$/, '');

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
  const qi = sequelize.getQueryInterface();
  // Add lorId column to ip_enrollments if not exists
  try {
    await qi.addColumn('ip_enrollments', 'lorId', { type: DataTypes.STRING(50), allowNull: true });
  } catch(e) {}
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
  const sealBlue = '#1d4ed8';
  const sealDarkBlue = '#1e3a8a';
  const legalText = 'SR PATIL INFRASTRUCTURE PRIVATE LIMITED';
  const cinText = 'U42909MH2024PTC429260';
  const sealRadius = 45;
  const drawCircularText = (text, radius, startAngle, endAngle, fontSize) => {
    const chars = text.split('');
    const step = chars.length > 1 ? (endAngle - startAngle) / (chars.length - 1) : 0;
    doc.fontSize(fontSize).font('Helvetica-Bold').fillColor(sealDarkBlue).fillOpacity(0.88);
    chars.forEach((char, index) => {
      const angle = startAngle + (step * index);
      const radians = (Math.PI / 180) * angle;
      const charX = x + Math.cos(radians) * radius;
      const charY = y + Math.sin(radians) * radius;
      doc.save();
      doc.translate(charX, charY);
      doc.rotate(angle + 90);
      doc.text(char, -2.2, -2.5, { width: 4.4, align: 'center' });
      doc.restore();
    });
  };
  const drawStampStar = (starX, starY, radius) => {
    doc.save();
    doc.fillColor(sealDarkBlue).fillOpacity(0.82);
    for (let point = 0; point < 10; point += 1) {
      const angle = (-90 + (point * 36)) * (Math.PI / 180);
      const pointRadius = point % 2 === 0 ? radius : radius * 0.42;
      const pointX = starX + Math.cos(angle) * pointRadius;
      const pointY = starY + Math.sin(angle) * pointRadius;
      if (point === 0) doc.moveTo(pointX, pointY);
      else doc.lineTo(pointX, pointY);
    }
    doc.closePath().fill();
    doc.restore();
  };

  doc.save();
  doc.lineWidth(1.5).strokeColor(sealDarkBlue).strokeOpacity(0.86);
  doc.circle(x, y, sealRadius).stroke();
  doc.lineWidth(1).strokeColor(sealBlue).strokeOpacity(0.74);
  doc.circle(x, y, 40.5).stroke();
  doc.lineWidth(0.55).strokeColor(sealDarkBlue).strokeOpacity(0.58);
  doc.circle(x, y, 29).stroke();

  doc.lineWidth(0.3).strokeColor(sealBlue).strokeOpacity(0.2);
  for (let index = 0; index < 28; index += 1) {
    const angle = (Math.PI * 2 * index) / 28;
    const inner = 31 + (index % 4);
    const outer = 43 - (index % 3);
    doc.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner)
      .lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer)
      .stroke();
  }

  doc.lineWidth(0.45).strokeColor(sealDarkBlue).strokeOpacity(0.18);
  for (let index = 0; index < 9; index += 1) {
    const yOffset = -24 + (index * 5.4);
    doc.moveTo(x - 24 + (index % 2), y + yOffset)
      .lineTo(x + 24 - (index % 3), y + yOffset + 0.7)
      .stroke();
  }

  drawCircularText(legalText, 36.5, 204, 336, 3.7);

  doc.fillColor(sealDarkBlue).fillOpacity(0.9);
  doc.fontSize(12.2).font('Helvetica-Bold')
    .text('HIRESNIX', x - 42, y - 10, { width: 84, align: 'center' });
  doc.fontSize(5).font('Helvetica-Bold')
    .text('CIN:', x - 42, y + 7, { width: 84, align: 'center' });
  doc.fontSize(4.7).font('Helvetica')
    .text(cinText, x - 42, y + 14, { width: 84, align: 'center' });
  doc.fontSize(6.2).font('Helvetica-Bold')
    .text('SHIRPUR', x - 42, y + 29, { width: 84, align: 'center' });
  drawStampStar(x - 31, y, 3.2);
  drawStampStar(x + 31, y, 3.2);
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

  // Calculate duration from startDate → completedAt
  let duration = enrollment.domain?.duration || '8 Weeks';
  const startD = enrollment.startDate ? new Date(enrollment.startDate) : null;
  const endD   = enrollment.completedAt ? new Date(enrollment.completedAt) : null;
  if (startD && endD && !isNaN(startD) && !isNaN(endD) && endD > startD) {
    let months = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth());
    const dayDiff = endD.getDate() - startD.getDate();
    if (dayDiff >= 15) months += 1;
    months = Math.max(1, months);
    duration = `${months} Month${months === 1 ? '' : 's'}`;
  }
  doc.fillColor('#475569').fontSize(12).font('Helvetica')
     .text(`Duration: ${duration}`, 0, 328, { align: 'center' });

  doc.fillColor('#475569').fontSize(12).font('Helvetica')
     .text(`at ${COMPANY.name} | Issued on ${issueDate}`, 0, 348, { align: 'center' });

  if (cert?.certificateNo) {
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
       .text(`Certificate No: ${cert.certificateNo}`, 0, 372, { align: 'center' });
  }

  // QR Code for Verification
  try {
    const certId = cert?.certificateNo || `CERT-${enrollment.id}`;
    const verifyUrl = `${getFrontendUrl()}/verify/${encodeURIComponent(certId)}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { errorCorrectionLevel: 'H', margin: 1 });
    const qrSize = 75;
    const qrX = (W / 2) - (qrSize / 2);
    const qrY = H - 168;
    doc.roundedRect(qrX - 9, qrY - 9, qrSize + 18, qrSize + 34, 6)
      .fillAndStroke('#ffffff', '#d4af37');
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, align: 'center'});
    doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold')
       .text('Scan to Verify', qrX, qrY + qrSize + 4, { width: qrSize, align: 'center' });
    doc.fillColor('#64748b').fontSize(5.5).font('Helvetica')
       .text(certId, qrX - 4, qrY + qrSize + 15, { width: qrSize + 8, align: 'center' });
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

  // ── LOR ID: generate once and save permanently ───────────────
  let lor_id = enrollment.lor_id;
  if (!lor_id) {
    lor_id = `HRX-LOR-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await enrollment.update({ lor_id }).catch(() => {});
  }

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="lor-${safeStudentName}.pdf"`);
  doc.pipe(res);

  pdfHeader(doc, 'LETTER OF RECOMMENDATION');

  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const performance = enrollment.lorPerformance || 'Excellent';
  const highlights = enrollment.lorHighlights || 'demonstrated strong problem-solving skills and a commitment to excellence';

  doc.moveDown(1);
  doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`Date: ${date}`, 40);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(`LOR ID: ${lor_id}`, 40);
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
  doc.moveDown(2.5);
  const sigY = doc.y;
  const W = doc.page.width;
  signatureLine(doc, 'Mr.Jayesh Badgujar', 'Program Director', 40, sigY, getSignaturePath('Director.png'), 1.6);
  signatureLine(doc, 'Mr.A S Borse', `Founder & CEO, ${COMPANY.name}`, W - 200, sigY, getSignaturePath('ceo.png'), 1.6);

  // QR Code — bottom center
  try {
    const lorVerifyUrl = `https://www.hiresnix.co.in/verification/recommendation-letter/${lor_id}`;
    const qrBuf = await QRCode.toBuffer(lorVerifyUrl, { errorCorrectionLevel: 'M', margin: 1, width: 100 });
    const qrSize = 65;
    const qrX = W / 2 - qrSize / 2;
    const qrY = sigY + 85;
    doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 24, 4)
       .fillAndStroke('#ffffff', '#1e3a8a');
    doc.image(qrBuf, qrX, qrY, { width: qrSize });
    doc.fillColor('#1e293b').fontSize(6.5).font('Helvetica-Bold')
       .text('Scan to Verify', qrX - 3, qrY + qrSize + 3, { width: qrSize + 6, align: 'center' });
    doc.fillColor('#64748b').fontSize(5).font('Helvetica')
       .text(lor_id, qrX - 3, qrY + qrSize + 13, { width: qrSize + 6, align: 'center' });
  } catch(e) {}

  pdfFooter(doc);
  doc.end();
});


const generateOfferLetter = asyncHandler(async (req, res) => {
  const { applicationId, candidateName, role, duration, joiningDate, endDate, offerLetterDate, salary, stipend } = req.body;
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
  const stableOfferId = application?.offerLetterId || `HSH-INT-${new Date(stableOfferDate).getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
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
  const stipendValue = String(stipend || salary || '').trim();
  const stipendText = stipendValue && !/^unpaid/i.test(stipendValue)
    ? `Rs. ${stipendValue.replace(/[₹]/g, '').trim()} per month, payable on or before the 5th day of each month`
    : 'Unpaid (Learning & Project-Based Internship)';

  if (application && (!application.offerLetterDate || !application.offerJoiningDate || !application.offerLetterId || !application.offerEndDate)) {
    const offerUpdate = {
      offerLetterDate: application.offerLetterDate || stableOfferDate,
      offerJoiningDate: application.offerJoiningDate || stableJoiningDate,
      offerLetterId: application.offerLetterId || stableOfferId,
      offerEndDate: application.offerEndDate || toIsoDateOnly(endDateObj),
      offerSalary: stipendText,
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
  const pageBottom = doc.page.height - 44;
  const legalEntity = 'SR PATIL INFRASTRUCTURE PRIVATE LIMITED';
  const cin = 'U42909MH2024PTC429260';
  const verificationEmail = 'hr@hiresnix.co.in';
  const cardRadius = 5;
  const cardBorder = '#e2e8f0';
  const cardFill = '#f8fafc';
  const cardPadding = 14;
  const sectionAccent = { width: 4, height: 14, gap: 12 };
  const paragraphGap = 0.55;
  const sectionGap = 0.65;

  const drawOfferFrame = (pageNo) => {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1.2).stroke(COMPANY.colors.accent);
    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).lineWidth(0.35).stroke('#cbd5e1');
    doc.rect(20, pageBottom, doc.page.width - 40, 18).fill('#0f172a');
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold')
      .text('Hiresnix Internship Program', 0, pageBottom + 3, { width: doc.page.width, align: 'center' });
    doc.fillColor('#94a3b8').fontSize(6.5).font('Helvetica')
      .text(`Operated by ${legalEntity}`, 0, pageBottom + 11, { width: doc.page.width, align: 'center' });
  };

  const drawSimpleHeader = (title, withTagline = false) => {
    doc.rect(20, 20, doc.page.width - 40, 88).fill('#0f172a');
    doc.rect(20, 106, doc.page.width - 40, 3).fill(COMPANY.colors.accent);
    doc.fillColor('#ffffff').fontSize(25).font('Helvetica-Bold')
      .text('HIRESNIX', left, 42);
    if (withTagline) {
      doc.fillColor('#cbd5e1').fontSize(10).font('Helvetica')
        .text('Empowering Future Professionals', left, 72);
    }
    doc.fillColor('#93c5fd').fontSize(14).font('Helvetica-Bold')
      .text(title, left, 56, { align: 'right', width: bodyWidth });
    doc.y = 136;
  };

  const sectionTitle = (title) => {
    doc.moveDown(0.35);
    const titleY = doc.y;
    doc.rect(left, titleY + 2, sectionAccent.width, sectionAccent.height).fill(COMPANY.colors.accent);
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold')
      .text(title, left + sectionAccent.gap, titleY, { width: bodyWidth - sectionAccent.gap, lineGap: 1 });
    doc.moveDown(0.35);
  };

  const paragraph = (text, options = {}) => {
    doc.fillColor('#334155').fontSize(options.size || 10).font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(text, left, doc.y, { width: bodyWidth, align: options.align || 'justify', lineGap: options.lineGap ?? 2 });
  };

  const bulletList = (items) => {
    items.forEach(item => {
      doc.fillColor('#334155').fontSize(10).font('Helvetica')
        .text(`${bullet} ${item}`, left + 20, doc.y, { width: bodyWidth - 20, lineGap: 2 });
    });
  };

  const detailRow = (label, value, x, y, width) => {
    doc.fillColor('#64748b').fontSize(7).font('Helvetica-Bold')
      .text(label.toUpperCase(), x, y, { width });
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold')
      .text(value, x, y + 10, { width, height: 24 });
  };

  drawOfferFrame(1);
  drawSimpleHeader('INTERNSHIP OFFER LETTER', true);

  const offerMetaY = doc.y;
  doc.roundedRect(left, offerMetaY, bodyWidth, 42, cardRadius).fill(cardFill).stroke(cardBorder);
  detailRow('Offer Letter ID', stableOfferId, left + cardPadding, offerMetaY + 9, 250);
  detailRow('Date', dateStr, left + 330, offerMetaY + 9, 160);
  doc.y = offerMetaY + 58;

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

  doc.moveDown(paragraphGap);
  paragraph('Your internship details are as follows:', { align: 'left' });
  sectionTitle('INTERNSHIP DETAILS');
  const detailY = doc.y;
  const cellW = (bodyWidth - 28) / 3;
  const cellH = 38;
  doc.roundedRect(left, detailY, bodyWidth, 118, cardRadius).fill(cardFill).stroke(cardBorder);
  [1, 2].forEach(index => {
    const x = left + cardPadding + (cellW * index);
    doc.moveTo(x, detailY + 10).lineTo(x, detailY + 108).lineWidth(0.35).stroke('#cbd5e1');
  });
  [1, 2].forEach(index => {
    const y = detailY + (cellH * index);
    doc.moveTo(left + cardPadding, y).lineTo(left + bodyWidth - cardPadding, y).lineWidth(0.35).stroke('#cbd5e1');
  });
  [
    ['Position', `${domainName} Intern`],
    ['Department', domainName],
    ['Start Date', joinDateStr],
    ['End Date', endDateStr],
    ['Duration', internshipDuration],
    ['Mode of Internship', 'Remote'],
    ['Working Hours', 'Flexible (Maximum 20 Hours per Week)'],
    ['Reporting Manager', 'Assigned Mentor / Project Lead'],
    ['Compensation', stipendText],
  ].forEach(([label, value], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    detailRow(label, value, left + cardPadding + (cellW * col) + 8, detailY + 8 + (cellH * row), cellW - 18);
  });
  doc.y = detailY + 134;

  paragraph('Hiresnix is a technology and business services company delivering recruitment, software development, artificial intelligence (AI), digital transformation, and consulting solutions to organizations. To support innovation and workforce development, the company offers structured internship opportunities that enable candidates to contribute to live business projects while gaining practical industry experience.');

  doc.moveDown(sectionGap);
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

  doc.moveDown(sectionGap);
  paragraph('Outstanding interns may be considered for future opportunities based on company requirements and performance evaluation.');
  doc.moveDown(sectionGap);
  paragraph('We look forward to supporting your professional growth and learning journey through Hiresnix.');

  doc.addPage({ size: 'A4', margin: 0 });
  drawOfferFrame(2);
  drawSimpleHeader('INTERNSHIP TERMS & ACKNOWLEDGEMENT');

  doc.roundedRect(left, doc.y, bodyWidth, 64, cardRadius).fill(cardFill).stroke(cardBorder);
  doc.y += cardPadding;
  paragraph('Upon successful completion of the internship and satisfactory performance evaluation, interns may be eligible to receive:');
  doc.moveDown(0.3);
  bulletList([
    'Internship Completion Certificate',
    'Internship Completion Letter',
    'Letter of Recommendation (subject to company evaluation)',
  ]);
  doc.y += 12;

  doc.moveDown(0.8);
  sectionTitle('Intern Responsibilities');
  bulletList([
    'Maintain professional conduct throughout the internship',
    'Complete assigned tasks within agreed timelines',
    'Participate actively in assigned projects',
    'Follow company communication and work guidelines',
  ]);

  doc.moveDown(0.8);
  sectionTitle('Internship Guidelines');
  bulletList([
    'Maintain regular communication with mentors',
    'Submit assigned work within specified timelines',
    'Follow ethical and professional work practices',
    'Respect project confidentiality and company resources',
  ]);

  doc.moveDown(0.55);
  sectionTitle('CONFIDENTIALITY');
  paragraph('The intern shall maintain the confidentiality of all company information, project materials, intellectual property, and confidential business information accessed during the internship.', { size: 9, lineGap: 1 });

  doc.moveDown(0.5);
  sectionTitle('Acceptance');
  paragraph('Please confirm your acceptance of this internship offer by replying to the official email or communication shared by Hiresnix.', { align: 'left' });

  doc.moveDown(0.35);
  paragraph('For verification or queries:', { align: 'left' });
  doc.moveDown(0.2);
  doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(verificationEmail, left);

  const signBlockY = 625;
  doc.moveTo(left, signBlockY).lineTo(left + bodyWidth, signBlockY).lineWidth(0.8).stroke('#cbd5e1');
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Regards,', left, signBlockY + 14);

  const sigY = signBlockY + 32;
  const founderTextY = sigY + 34;
  const pageW = doc.page.width;

  // ── LEFT: Signature + Contact info ───────────────────────────
  try { doc.image(getSignaturePath('ceo.png'), left, sigY, { fit: [120, 48] }); } catch (err) {}
  doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold')
    .text('A S Borse', left, founderTextY, { width: 220, lineGap: 0 });
  doc.fillColor('#334155').fontSize(8.8).font('Helvetica')
    .text('Founder & CEO \u2013 Hiresnix', left, founderTextY + 12, { width: 220, lineGap: 0 })
    .text('For', left, founderTextY + 26, { width: 220, lineGap: 0 })
    .text(legalEntity, left, founderTextY + 36, { width: 220, lineGap: 0 })
    .text('CIN:', left, founderTextY + 49, { width: 220, lineGap: 0 })
    .text(cin, left, founderTextY + 59, { width: 220, lineGap: 0 })
    .text('support@hiresnix.co.in', left, founderTextY + 74, { width: 220, lineGap: 0 })
    .text('www.hiresnix.co.in', left, founderTextY + 84, { width: 220, lineGap: 0 })
    .text('Shirpur, Maharashtra, India', left, founderTextY + 94, { width: 220, lineGap: 0 });

  // ── CENTER: Seal ──────────────────────────────────────────────
  drawOfferSeal(doc, pageW / 2, sigY + 45);

  // ── RIGHT: QR Code ────────────────────────────────────────────
  try {
    const offerVerifyUrl = `https://www.hiresnix.co.in/verification/offer-letter/${stableOfferId}`;
    const qrBuf2 = await QRCode.toBuffer(offerVerifyUrl, { errorCorrectionLevel: 'H', margin: 1, width: 120 });
    const qrSize2 = 70;
    const qrX2 = pageW - left - qrSize2;
    const qrY2 = founderTextY - 5;
    doc.roundedRect(qrX2 - 4, qrY2 - 4, qrSize2 + 8, qrSize2 + 24, 4)
       .fillAndStroke('#ffffff', '#1e3a8a');
    doc.image(qrBuf2, qrX2, qrY2, { width: qrSize2 });
    doc.fillColor('#1e293b').fontSize(6).font('Helvetica-Bold')
       .text('Scan to Verify', qrX2 - 3, qrY2 + qrSize2 + 3, { width: qrSize2 + 6, align: 'center' });
    doc.fillColor('#64748b').fontSize(5).font('Helvetica')
       .text(stableOfferId, qrX2 - 3, qrY2 + qrSize2 + 12, { width: qrSize2 + 6, align: 'center' });
  } catch(e) {}

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
  ['Internship Completion Certificate', 'Letter of Recommendation (LOR)', 'Skill Assessment Report (if applicable)']
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

const verifyOfferLetter = asyncHandler(async (req, res) => {
  const offerId = (req.params.offerId || '').trim();
  if (!offerId) {
    res.status(400); throw new Error('Offer Letter ID is required');
  }

  const normalizedOfferId = offerId.toUpperCase();
  const offerIdVariants = Array.from(new Set([
    offerId,
    normalizedOfferId,
    normalizedOfferId.replace(/^HSN-INT-/i, 'HSH-INT-'),
    normalizedOfferId.replace(/^HSH-INT-/i, 'HSN-INT-'),
  ]));

  let application = await InternshipApplication.findOne({
    where: { offerLetterId: { [Op.in]: offerIdVariants } },
    include: [{ model: Domain, as: 'domain' }],
  });

  if (!application) {
    application = await InternshipApplication.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('offerLetterId')),
        normalizedOfferId.toLowerCase()
      ),
      include: [{ model: Domain, as: 'domain' }],
    });
  }

  if (!application || !application.offerLetterId) {
    res.status(404); throw new Error('Offer letter not found or invalid');
  }

  res.json({
    success: true,
    valid: true,
    data: {
      documentType: 'Offer Letter',
      documentId: application.offerLetterId,
      offerLetterId: application.offerLetterId,
      studentName: application.studentName,
      issueDate: application.offerLetterDate || application.updatedAt || application.createdAt,
      internshipDomain: application.domain?.name || 'Internship Program',
    },
  });
});

const verifyRecommendationLetter = asyncHandler(async (req, res) => {
  const recommendationId = (req.params.recommendationId || '').trim().toUpperCase()
    .replace(/^LOR\s*ID\s*:\s*/i, '').trim();
  if (!recommendationId) {
    res.status(400); throw new Error('Recommendation Letter ID is required');
  }

  let enrollment = null;

  // Try lor_id format (HRX-LOR-YYYY-XXXXXX)
  if (recommendationId.startsWith('HRX-LOR-')) {
    enrollment = await InternshipEnrollment.findOne({
      where: { lor_id: recommendationId, status: 'Completed' },
      include: [{ model: Domain, as: 'domain' }],
    }).catch(() => null);
  }

  // Fallback: numeric enrollment ID
  if (!enrollment) {
    const enrollmentId = recommendationId.replace(/^(LOR|REC|RL|HRX-LOR-\d+-)/i, '');
    if (/^\d+$/.test(enrollmentId)) {
      enrollment = await InternshipEnrollment.findOne({
        where: { id: enrollmentId, status: 'Completed' },
        include: [{ model: Domain, as: 'domain' }],
      });
    }
  }

  if (!enrollment) {
    return res.json({ success: true, valid: false, data: null });
  }

  res.json({
    success: true,
    valid: true,
    data: {
      documentType: 'Letter of Recommendation',
      documentId: enrollment.lor_id || `LOR-${enrollment.id}`,
      studentName: enrollment.studentName,
      issueDate: enrollment.completedAt || enrollment.updatedAt || enrollment.createdAt,
      internshipDomain: enrollment.domain?.name || 'Internship Program',
    },
  });
});

// ── APPOINTMENT LETTER (Admin Only) ──────────────────────────────
const generateAppointmentLetter = asyncHandler(async (req, res) => {
  const {
    candidateName, designation, department, employmentType,
    startDate, endDate, stipend, ctc,
    workingHours, workingDays, reportingManager, location,
    probationPeriod, noticePeriod,
  } = req.body;

  if (!candidateName || !designation || !employmentType || !startDate) {
    res.status(400); throw new Error('Missing required fields');
  }

  const isInternship = employmentType === 'internship';
  const issueDate    = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDate      = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A';
  const docNo        = `HX-APT-${Date.now().toString().slice(-6)}`;
  const stipendStr   = stipend ? `Rs. ${Number(stipend).toLocaleString('en-IN')} per month` : 'As per agreement';
  const ctcStr       = ctc    ? `Rs. ${Number(ctc).toLocaleString('en-IN')} per annum`     : 'As per agreement';

  const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Appointment_Letter_${candidateName.replace(/\s+/g,'_')}.pdf"`);
  doc.pipe(res);

  const W    = doc.page.width;   // 595
  const H    = doc.page.height;  // 842
  const M    = 55;               // left/right margin
  const NAVY = '#1a3a5c';
  const BLUE = '#1e40af';
  const DARK = '#111827';
  const GRAY = '#374151';
  const MID  = '#6b7280';
  const LG   = '#f3f4f6';
  const WHT  = '#ffffff';

  // ─────────────────────────────────────────────────────────────────
  // HELPER: draw page header (used on both pages)
  // ─────────────────────────────────────────────────────────────────
  const drawHeader = () => {
    doc.rect(0, 0, W, 85).fill(NAVY);
    // Left: company name
    doc.fillColor(WHT).fontSize(20).font('Helvetica-Bold').text('HIRESNIX', M, 18);
    doc.fillColor('#93c5fd').fontSize(8.5).font('Helvetica').text('Empowering Future Professionals', M, 46);
    // Thin vertical divider
    doc.moveTo(W/2, 10).lineTo(W/2, 74).strokeColor('rgba(255,255,255,0.12)').lineWidth(0.5).stroke();
    // Right: contact block
    const cx = W/2 + 18;
    doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica');
    doc.text('Address : Shirpur, Dhule, Maharashtra - 425405', cx, 14, { width: W - cx - M });
    doc.text('Phone   : +91 9529120977',  cx, 28, { width: W - cx - M });
    doc.text('Email   : hr@hiresnix.co.in', cx, 42, { width: W - cx - M });
    doc.text('Web     : www.hiresnix.co.in', cx, 56, { width: W - cx - M });
    // Blue accent bar
    doc.rect(0, 85, W, 3).fill(BLUE);
  };

  // ─────────────────────────────────────────────────────────────────
  // PAGE 1
  // ─────────────────────────────────────────────────────────────────
  doc.rect(0, 0, W, H).fill(WHT);
  drawHeader();

  // Title
  doc.fillColor(NAVY).fontSize(13).font('Helvetica-Bold')
     .text(isInternship ? 'APPOINTMENT LETTER FOR INTERNSHIP' : 'APPOINTMENT LETTER', 0, 106, { align: 'center', width: W });
  const tW = 300;
  doc.moveTo((W-tW)/2, 124).lineTo((W+tW)/2, 124).strokeColor(NAVY).lineWidth(0.8).stroke();

  // Ref & Date row
  doc.fillColor(MID).fontSize(8.5).font('Helvetica')
     .text(`Ref No: ${docNo}`, M, 133)
     .text(`Date: ${issueDate}`, 0, 133, { align: 'right', width: W - M });

  doc.y = 152;

  // Salutation
  doc.fillColor(DARK).fontSize(10.5).font('Helvetica').text(`Dear ${candidateName.trim()},`, M);
  doc.moveDown(0.55);

  // Opening para
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(
       `We are pleased to ${isInternship ? 'offer you an internship' : 'appoint you'} at Hiresnix for the position of `,
       M, doc.y, { continued: true, width: W - M*2 }
     );
  doc.fillColor(DARK).font('Helvetica-Bold').text(`${designation}`, { continued: true });
  doc.fillColor(GRAY).font('Helvetica')
     .text(` in the ${department || 'Technology'} department. This letter outlines the terms and conditions of your ${isInternship ? 'internship' : 'employment'} with our organization.`, { width: W - M*2 });

  doc.moveDown(0.6);

  // Internship / Job Title line
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
     .text(`${isInternship ? 'Internship' : 'Job'} Title: `, M, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(GRAY).text(designation);

  // ── Responsibilities ─────────────────────────────────────────────
  doc.moveDown(0.6);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Roles & Responsibilities:', M);
  doc.moveDown(0.2);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(`In this role, you will be expected to:`, M, doc.y, { width: W - M*2 });
  doc.moveDown(0.3);

  const responsibilities = isInternship ? [
    'Assist the team with assigned projects, tasks, and deliverables.',
    'Collaborate with team members and report progress to your supervisor regularly.',
    'Contribute innovative ideas and solutions to ongoing projects and initiatives.',
    'Prepare reports, documentation, and presentations as required by the team.',
    'Adhere to company policies, code of conduct, and professional standards at all times.',
  ] : [
    'Plan, execute, and deliver projects within the assigned domain on schedule.',
    'Collaborate effectively with cross-functional teams and key stakeholders.',
    'Maintain high quality standards and meet all agreed project deadlines.',
    'Report progress and escalate issues to the reporting manager in a timely manner.',
    'Drive company growth through innovation, continuous improvement, and accountability.',
  ];

  responsibilities.forEach(r => {
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(`\u2022  ${r}`, M + 10, doc.y, { width: W - M*2 - 10 });
    doc.moveDown(0.28);
  });

  // ── Work Schedule Table ──────────────────────────────────────────
  doc.moveDown(0.5);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Work Schedule Details:', M);
  doc.moveDown(0.3);

  const schedule = [
    ['Start Date',       fmtDate(startDate)],
    ...(isInternship && endDate ? [['End Date', fmtDate(endDate)]] : []),
    ['Employment Type',  isInternship ? 'Internship (Fixed Term)' : 'Full-Time (Permanent)'],
    ['Work Location',    location || 'Shirpur, Maharashtra / Remote'],
    ['Working Days',     workingDays || 'Monday to Saturday'],
    ['Working Hours',    workingHours || '9:00 AM to 6:00 PM'],
    ['Reporting To',     reportingManager || 'Mr. A.S. Borse, Founder & CEO'],
  ];

  const col1 = 160;
  const tblW = W - M*2;
  let ty = doc.y;

  // Table header
  doc.rect(M, ty, tblW, 18).fill(NAVY);
  doc.fillColor(WHT).fontSize(8.5).font('Helvetica-Bold')
     .text('Particulars', M + 8, ty + 4, { width: col1 - 8 });
  doc.text('Details', M + col1 + 8, ty + 4, { width: tblW - col1 - 8 });
  ty += 18;

  schedule.forEach(([k, v], i) => {
    const rH = 19;
    doc.rect(M, ty, tblW, rH).fill(i % 2 === 0 ? LG : WHT);
    doc.rect(M, ty, tblW, rH).strokeColor('#d1d5db').lineWidth(0.4).stroke();
    doc.fillColor(DARK).fontSize(9.5).font('Helvetica-Bold').text(k, M + 8, ty + 4, { width: col1 - 8 });
    doc.fillColor(GRAY).font('Helvetica').text(v, M + col1 + 8, ty + 4, { width: tblW - col1 - 16 });
    ty += rH;
  });
  doc.y = ty + 10;

  // ── Compensation ─────────────────────────────────────────────────
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Compensation:', M, doc.y, { continued: true });
  if (isInternship) {
    doc.fillColor(GRAY).font('Helvetica')
       .text(` You will receive a monthly stipend of `, { continued: true });
    doc.fillColor(DARK).font('Helvetica-Bold').text(stipendStr, { continued: true });
    doc.fillColor(GRAY).font('Helvetica')
       .text(`. Stipend will be credited by the 5th of each month, subject to satisfactory performance and attendance.`);
  } else {
    doc.fillColor(GRAY).font('Helvetica')
       .text(` Your annual Cost to Company (CTC) will be `, { continued: true });
    doc.fillColor(DARK).font('Helvetica-Bold').text(ctcStr, { continued: true });
    doc.fillColor(GRAY).font('Helvetica')
       .text(`. Applicable taxes (TDS) will be deducted as per statutory requirements.`);
  }

  // ── Benefits ─────────────────────────────────────────────────────
  doc.moveDown(0.6);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Benefits:', M);
  doc.moveDown(0.2);
  const benefits = isInternship ? [
    'Internship Completion Certificate upon successful completion.',
    'Letter of Recommendation based on performance evaluation.',
    'Access to company tools, resources, and learning materials.',
    'Mentorship and hands-on guidance from experienced professionals.',
  ] : [
    'Paid leave as per company policy (casual, sick, and earned leave).',
    'Professional development and training programs.',
    'Performance-based appraisal and annual increments.',
    'Experience letter and applicable statutory benefits.',
  ];
  benefits.forEach(b => {
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(`\u2022  ${b}`, M + 10, doc.y, { width: W - M*2 - 10 });
    doc.moveDown(0.28);
  });

  // ── Footer page 1 ────────────────────────────────────────────────
  pdfFooter(doc);

  // ─────────────────────────────────────────────────────────────────
  // PAGE 2
  // ─────────────────────────────────────────────────────────────────
  doc.addPage();
  doc.rect(0, 0, W, H).fill(WHT);
  drawHeader();

  doc.y = 105;

  // ── Terms & Conditions ───────────────────────────────────────────
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Terms & Conditions:', M);
  doc.moveDown(0.3);
  const terms = isInternship ? [
    'This internship is for the fixed period mentioned above and will not be automatically extended without a written mutual agreement.',
    'The intern shall maintain strict confidentiality of all company information, client data, project materials, and intellectual property during and after the internship period.',
    'Either party may terminate this arrangement by providing 7 days\' prior written notice to the other party.',
    'The intern is expected to maintain professional conduct and adhere to all company policies, guidelines, and code of conduct at all times.',
    'All work, deliverables, code, designs, or content produced during the internship remain the exclusive intellectual property of Hiresnix.',
    'The intern shall not engage in any activity that conflicts with the interests of Hiresnix during the internship period.',
  ] : [
    `This appointment is subject to a probation period of ${probationPeriod || '3 months'}. Confirmation of employment will be based on satisfactory performance review.`,
    `A notice period of ${noticePeriod || '30 days'} is applicable from either party. Salary in lieu of notice may be considered at the sole discretion of the company.`,
    'The employee shall not disclose any confidential or proprietary information of the company to any third party, during or after the period of employment.',
    'This appointment is subject to verification of all submitted educational qualifications, professional documents, and background checks.',
    'Any misconduct, violation of company policy, or breach of confidentiality may result in disciplinary action including immediate termination.',
    'The employee shall not take up any other employment or assignment without prior written consent from the company management.',
  ];

  terms.forEach((t, i) => {
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold')
       .text(`${i+1}.`, M + 6, doc.y, { continued: true, width: 16 });
    doc.fillColor(GRAY).font('Helvetica')
       .text(`  ${t}`, { width: W - M*2 - 22, align: 'justify' });
    doc.moveDown(0.35);
  });

  // ── Documents Required ───────────────────────────────────────────
  doc.moveDown(0.3);
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Documents to be Submitted on Joining:', M);
  doc.moveDown(0.25);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text('Please sign and return a copy of this letter as your acceptance. Kindly submit the following documents:', M, doc.y, { width: W - M*2 });
  doc.moveDown(0.25);
  [
    'Valid Government-issued Photo ID proof (Aadhaar Card / PAN Card)',
    'Updated Resume / Curriculum Vitae',
    'Educational qualification certificates (for verification purposes)',
    'Bank account details for stipend / salary transfer (Account No., IFSC Code, Branch)',
  ].forEach(d => {
    doc.fillColor(GRAY).fontSize(10).font('Helvetica')
       .text(`\u2022  ${d}`, M + 10, doc.y, { width: W - M*2 - 10 });
    doc.moveDown(0.28);
  });

  // ── Closing para ─────────────────────────────────────────────────
  doc.moveDown(0.4);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(
       `We look forward to welcoming you to the Hiresnix family and are confident that you will make valuable contributions to our team. Should you have any questions or require clarification, please feel free to contact us at `,
       M, doc.y, { width: W - M*2, continued: true }
     );
  doc.fillColor(DARK).font('Helvetica-Bold').text('hr@hiresnix.co.in', { continued: true });
  doc.fillColor(GRAY).font('Helvetica').text(' or call us at +91 9529120977.');

  // ── Signature block ──────────────────────────────────────────────
  doc.moveDown(0.9);
  doc.fillColor(DARK).fontSize(10).font('Helvetica').text('Yours sincerely,', M);
  doc.moveDown(1.6);
  const sigY = doc.y;
  signatureLine(doc, 'Mr. A.S. Borse', 'Founder & CEO, Hiresnix', M, sigY, getSignaturePath('ceo.png'), 1.2);

  // ── Acceptance section ───────────────────────────────────────────
  doc.y = sigY + 80;
  doc.rect(M, doc.y, W - M*2, 0.6).fill('#d1d5db');
  doc.y += 12;

  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('ACCEPTANCE BY CANDIDATE:', M);
  doc.moveDown(0.35);
  doc.fillColor(GRAY).fontSize(10).font('Helvetica')
     .text(
       `I, `,
       M, doc.y, { continued: true }
     );
  doc.fillColor(DARK).font('Helvetica-Bold').text(`${candidateName.trim()}`, { continued: true });
  doc.fillColor(GRAY).font('Helvetica')
     .text(`, hereby accept this ${isInternship ? 'internship offer' : 'appointment'} at Hiresnix and agree to abide by all the terms and conditions mentioned in this letter.`,
       { width: W - M*2 });
  doc.moveDown(1.2);

  // Signature lines
  const slY = doc.y;
  // Left: candidate
  doc.moveTo(M, slY).lineTo(M + 210, slY).strokeColor('#9ca3af').lineWidth(0.6).stroke();
  doc.fillColor(MID).fontSize(8.5).font('Helvetica').text('Candidate Signature', M, slY + 5);
  doc.text(candidateName.trim(), M, slY + 16);
  // Right: date
  doc.moveTo(W - M - 170, slY).lineTo(W - M, slY).strokeColor('#9ca3af').lineWidth(0.6).stroke();
  doc.fillColor(MID).fontSize(8.5).font('Helvetica').text('Date of Acceptance', W - M - 170, slY + 5);
  doc.text('___________________', W - M - 170, slY + 16);

  // ── Footer page 2 ────────────────────────────────────────────────
  pdfFooter(doc);
  doc.end();
});




// ── JOINING LETTER (Admin Only) ───────────────────────────────────
const generateJoiningLetter = asyncHandler(async (req, res) => {
  const {
    candidateName, designation, department, employmentType,
    joiningDate, stipend, ctc, reportingManager, location,
  } = req.body;

  if (!candidateName || !designation || !joiningDate) {
    res.status(400); throw new Error('Missing required fields');
  }

  const isInternship = employmentType === 'internship';
  const issueDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtJoining = new Date(joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const docNo = `HX-JL-${Date.now().toString().slice(-6)}`;

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Joining_Letter_${candidateName.replace(/\s+/g,'_')}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const MARGIN = 50;
  const NAVY = '#0f172a';
  const GOLD = '#d4af37';
  const GRAY = '#475569';
  const LIGHT = '#f8fafc';

  // Header
  doc.rect(0, 0, W, 110).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Hiresnix', MARGIN, 28);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Empowering Future Professionals', MARGIN, 57);
  doc.fillColor('#60a5fa').fontSize(12).font('Helvetica-Bold')
     .text('JOINING LETTER', 0, 46, { align: 'right', width: W - MARGIN });
  doc.rect(0, 110, W, 3).fill(GOLD);

  // Ref & Date
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text(`Ref No: ${docNo}`, MARGIN, 130)
     .text(`Date: ${issueDate}`, 0, 130, { align: 'right', width: W - MARGIN });

  // Body
  doc.y = 155;
  doc.fillColor(NAVY).fontSize(11).font('Helvetica-Bold').text(`Dear ${candidateName},`, MARGIN);
  doc.moveDown(0.8);
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
     .text(
       `With reference to your acceptance of the ${isInternship ? 'internship' : 'appointment'} offer, we are pleased to confirm your joining at Hiresnix as ${designation} effective ${fmtJoining}.`,
       MARGIN, doc.y, { width: W - MARGIN * 2 }
     );

  // Joining details box
  doc.moveDown(1.2);
  const boxTop = doc.y;
  doc.rect(MARGIN, boxTop, W - MARGIN * 2, 14).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('JOINING DETAILS', MARGIN + 10, boxTop + 3);

  const rows = [
    ['Name', candidateName],
    ['Designation', designation],
    ['Department', department || 'Technology'],
    ['Type', isInternship ? 'Internship' : 'Full-Time'],
    ['Date of Joining', fmtJoining],
    ['Work Location', location || 'Shirpur, Maharashtra / Remote'],
    ['Reporting To', reportingManager || 'Mr. A.S. Borse (Founder & CEO)'],
    [isInternship ? 'Monthly Stipend' : 'CTC',
      isInternship
        ? (stipend ? `₹${Number(stipend).toLocaleString('en-IN')}/month` : 'As per agreement')
        : (ctc ? `₹${Number(ctc).toLocaleString('en-IN')} per annum` : 'As per agreement')],
  ];

  let rowY = boxTop + 18;
  rows.forEach((row, i) => {
    doc.rect(MARGIN, rowY, W - MARGIN * 2, 18).fill(i % 2 === 0 ? LIGHT : '#ffffff');
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text(row[0], MARGIN + 10, rowY + 5, { width: 180 });
    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(row[1], MARGIN + 200, rowY + 5, { width: W - MARGIN * 2 - 210 });
    rowY += 18;
  });
  doc.rect(MARGIN, boxTop, W - MARGIN * 2, rowY - boxTop).stroke('#e2e8f0');

  // Documents to carry
  doc.y = rowY + 16;
  doc.rect(MARGIN, doc.y, W - MARGIN * 2, 14).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('DOCUMENTS TO SUBMIT ON JOINING', MARGIN + 10, doc.y + 3);
  doc.moveDown(0.2);
  const docs = [
    'Signed copy of this Joining Letter',
    'Signed copy of Appointment Letter',
    'Aadhar Card (original + 1 photocopy)',
    'PAN Card (original + 1 photocopy)',
    '2 recent passport-size photographs',
    'Educational certificates (original for verification)',
    'Bank account details for stipend/salary transfer',
  ];
  docs.forEach((d, i) => {
    doc.fillColor('#334155').fontSize(9).font('Helvetica')
       .text(`${i + 1}. ${d}`, MARGIN + 10, doc.y + 4, { width: W - MARGIN * 2 - 20 });
    doc.moveDown(0.3);
  });

  // Closing
  doc.moveDown(0.8);
  doc.fillColor('#334155').fontSize(10).font('Helvetica')
     .text("We look forward to welcoming you to the Hiresnix family. Wishing you a successful journey with us!", MARGIN, doc.y, { width: W - MARGIN * 2 });
  doc.moveDown(0.5);
  doc.text("Please sign and return a copy of this letter on or before your joining date.", MARGIN, doc.y, { width: W - MARGIN * 2 });

  // Signatures
  const sigY = doc.y + 30;
  signatureLine(doc, 'Mr. A.S. Borse', 'Founder & CEO, Hiresnix', MARGIN, sigY, getSignaturePath('ceo.png'), 1.4);
  const candX = W / 2 + 20;
  doc.moveTo(candX, sigY).lineTo(candX + 160, sigY).stroke('#334155');
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(candidateName, candX, sigY + 6, { width: 160, align: 'center' });
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text("Candidate's Signature & Date", candX, sigY + 20, { width: 160, align: 'center' });

  pdfFooter(doc);
  doc.end();
});

// ── STIPEND SLIP (Admin Only) ─────────────────────────────────────
const generateStipendSlip = asyncHandler(async (req, res) => {
  const {
    candidateName, designation, department, employeeId,
    month, year,
    basicStipend, allowances, deductions,
  } = req.body;

  if (!candidateName || !month || !year || !basicStipend) {
    res.status(400); throw new Error('Missing required fields');
  }

  const basic = Number(basicStipend) || 0;
  const allow = Number(allowances) || 0;
  const deduct = Number(deductions) || 0;
  const gross = basic + allow;
  const net = gross - deduct;
  const monthName = new Date(`${year}-${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const issueDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const slipNo = `HX-SS-${year}${month}-${Date.now().toString().slice(-4)}`;

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Stipend_Slip_${candidateName.replace(/\s+/g,'_')}_${monthName.replace(' ','_')}.pdf"`);
  doc.pipe(res);

  const W = doc.page.width;
  const MARGIN = 50;
  const NAVY = '#0f172a';
  const GOLD = '#d4af37';
  const GRAY = '#475569';
  const GREEN = '#16a34a';
  const LIGHT = '#f8fafc';

  // Header
  doc.rect(0, 0, W, 110).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Hiresnix', MARGIN, 28);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Empowering Future Professionals', MARGIN, 57);
  doc.fillColor('#60a5fa').fontSize(12).font('Helvetica-Bold')
     .text('STIPEND SLIP', 0, 46, { align: 'right', width: W - MARGIN });
  doc.rect(0, 110, W, 3).fill(GOLD);

  // Slip info
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
     .text(`Slip No: ${slipNo}`, MARGIN, 130)
     .text(`Pay Period: ${monthName}  |  Issue Date: ${issueDate}`, 0, 130, { align: 'right', width: W - MARGIN });

  // Employee details
  doc.y = 155;
  doc.rect(MARGIN, doc.y, W - MARGIN * 2, 14).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('EMPLOYEE DETAILS', MARGIN + 10, doc.y + 3);
  doc.moveDown(0.2);

  const empRows = [
    ['Name', candidateName],
    ['Designation', designation || 'Intern'],
    ['Department', department || 'Technology'],
    ['Employee / Intern ID', employeeId || 'N/A'],
    ['Pay Period', monthName],
  ];
  let rowY = doc.y + 4;
  empRows.forEach((row, i) => {
    doc.rect(MARGIN, rowY, W - MARGIN * 2, 18).fill(i % 2 === 0 ? LIGHT : '#ffffff');
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text(row[0], MARGIN + 10, rowY + 5, { width: 180 });
    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(row[1], MARGIN + 200, rowY + 5);
    rowY += 18;
  });
  doc.rect(MARGIN, doc.y + 4, W - MARGIN * 2, rowY - (doc.y + 4)).stroke('#e2e8f0');

  // Earnings & Deductions side by side
  doc.y = rowY + 16;
  const halfW = (W - MARGIN * 2 - 10) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + halfW + 10;

  // Earnings header
  doc.rect(leftX, doc.y, halfW, 14).fill(GREEN);
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('EARNINGS', leftX + 10, doc.y + 3);
  // Deductions header
  doc.rect(rightX, doc.y, halfW, 14).fill('#dc2626');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS', rightX + 10, doc.y + 3);

  const earningsY = doc.y + 18;
  // Earnings rows
  [['Basic Stipend', `₹${basic.toLocaleString('en-IN')}`],
   ['Allowances', `₹${allow.toLocaleString('en-IN')}`]
  ].forEach((row, i) => {
    doc.rect(leftX, earningsY + i * 18, halfW, 18).fill(i % 2 === 0 ? LIGHT : '#ffffff');
    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(row[0], leftX + 10, earningsY + i * 18 + 5);
    doc.fillColor(NAVY).fontSize(9).font('Helvetica-Bold').text(row[1], leftX, earningsY + i * 18 + 5, { align: 'right', width: halfW - 10 });
  });

  // Deductions rows
  [['Tax / TDS', `₹${deduct.toLocaleString('en-IN')}`],
   ['Other Deductions', '₹0']
  ].forEach((row, i) => {
    doc.rect(rightX, earningsY + i * 18, halfW, 18).fill(i % 2 === 0 ? LIGHT : '#ffffff');
    doc.fillColor('#334155').fontSize(9).font('Helvetica').text(row[0], rightX + 10, earningsY + i * 18 + 5);
    doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text(row[1], rightX, earningsY + i * 18 + 5, { align: 'right', width: halfW - 10 });
  });

  // Totals
  const totY = earningsY + 36 + 4;
  doc.rect(leftX, totY, halfW, 20).fill('#dcfce7');
  doc.fillColor(GREEN).fontSize(9).font('Helvetica-Bold').text('Gross Earnings', leftX + 10, totY + 5);
  doc.text(`₹${gross.toLocaleString('en-IN')}`, leftX, totY + 5, { align: 'right', width: halfW - 10 });

  doc.rect(rightX, totY, halfW, 20).fill('#fee2e2');
  doc.fillColor('#dc2626').fontSize(9).font('Helvetica-Bold').text('Total Deductions', rightX + 10, totY + 5);
  doc.text(`₹${deduct.toLocaleString('en-IN')}`, rightX, totY + 5, { align: 'right', width: halfW - 10 });

  // Net Pay
  doc.y = totY + 30;
  doc.rect(MARGIN, doc.y, W - MARGIN * 2, 28).fill(NAVY);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
     .text(`NET STIPEND PAYABLE:  ₹${net.toLocaleString('en-IN')}`, MARGIN + 10, doc.y + 8, { width: W - MARGIN * 2 - 20, align: 'center' });

  // Note
  doc.y += 40;
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
     .text('* This is a computer-generated stipend slip and does not require a physical signature.', MARGIN, doc.y, { width: W - MARGIN * 2, align: 'center' });
  doc.moveDown(0.5);
  doc.text('* For any queries regarding this slip, please contact hr@hiresnix.co.in', MARGIN, doc.y, { width: W - MARGIN * 2, align: 'center' });

  // Signature
  const sigY = doc.y + 30;
  signatureLine(doc, 'Mr. A.S. Borse', 'Founder & CEO, Hiresnix', MARGIN, sigY, getSignaturePath('ceo.png'), 1.4);

  pdfFooter(doc);
  doc.end();
});

module.exports = {
  getDomains, createDomain, deleteDomain,
  applyInternship, getMyApplication, getAllApplications, updateApplicationStatus,
  getResources, addResource, deleteResource,
  getMyProgress, submitTask, markComplete,
  getMyCertificates, downloadCertificate, downloadCompletionLetter, downloadLOR,
  generateOfferLetter,
  getStats, getEnrolledStudents, getAllEnrollments,
  verifyCertificate, verifyOfferLetter, verifyRecommendationLetter,
  generateAppointmentLetter, generateJoiningLetter, generateStipendSlip,
};