/**
 * controllers/instStudentController.js
 * Institution Student Portal — Login + Dashboard
 */
const asyncHandler  = require('express-async-handler');
const PDFDocument   = require('pdfkit');
const QRCode        = require('qrcode');
const path          = require('path');
const fs            = require('fs');
const jwt          = require('jsonwebtoken');
const bcrypt       = require('bcryptjs');
const crypto       = require('crypto');
const { Op }       = require('sequelize');
const {
  InstitutionStudent, Institution,
  Batch, BatchStudent, Course, CourseStudent, InstitutionCertificate,
  User,
} = require('../models');

// ── JWT for institution students ─────────────────────────────────
function signToken(student) {
  return jwt.sign(
    { id: student.id, role: 'inst_student', institutionId: student.institutionId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

// ── Middleware: protect inst student routes ───────────────────────
const protectInstStudent = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) { res.status(401); throw new Error('Not authorized'); }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'inst_student') { res.status(401); throw new Error('Invalid token type'); }
    const student = await InstitutionStudent.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Institution, as: 'institution', attributes: ['institutionName','city','state','isPartner','logo'] }],
    });
    if (!student) { res.status(401); throw new Error('Student not found'); }
    req.instStudent = student;
    next();
  } catch (err) {
    res.status(401); throw new Error('Token invalid or expired');
  }
});

// ── POST /api/inst-student/login ─────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { careerId, password } = req.body;
  if (!careerId || !password) { res.status(400); throw new Error('Career ID and password required'); }

  const student = await InstitutionStudent.findOne({
    where: { careerId: careerId.trim().toUpperCase() },
    include: [{ model: Institution, as: 'institution', attributes: ['institutionName','isVerified','id'] }],
  });

  if (!student || !student.password) {
    res.status(401); throw new Error('Invalid Career ID or password');
  }

  const match = await student.matchPassword(password);
  if (!match) { res.status(401); throw new Error('Invalid Career ID or password'); }

  // ── Auto-create or find linked Hiresnix User account ──────────
  // Email format: careerId@inst.hiresnix.co.in (unique, internal)
  const syntheticEmail = `${student.careerId.toLowerCase()}@inst.hiresnix.co.in`;
  let hiresnixUser = null;
  let hiresnixToken = null;

  try {
    // Try to find existing linked user
    hiresnixUser = await User.findOne({ where: { email: syntheticEmail } });

    if (!hiresnixUser) {
      // Create new Hiresnix User for this inst student
      const tempPassword = crypto.randomBytes(16).toString('hex'); // random internal password
      hiresnixUser = await User.create({
        name: student.name,
        email: syntheticEmail,
        password: tempPassword,
        role: 'student',
        isActive: true,
        isApproved: true,
      });

      // Also create Student profile entry so internship APIs work
      const { Student } = require('../models');
      await Student.findOrCreate({
        where: { userId: hiresnixUser.id },
        defaults: {
          userId: hiresnixUser.id,
          isProfileComplete: false,
        },
      });
    }

    hiresnixToken = hiresnixUser.getSignedJwtToken();
  } catch (err) {
    // If user creation fails, still allow inst portal login
    console.error('Hiresnix user link failed:', err.message);
  }

  // Update last login
  await student.update({ lastLogin: new Date() });

  const token = signToken(student);
  res.json({
    success: true,
    token,
    hiresnixToken,  // null if linking failed — frontend handles gracefully
    hiresnixUserId: hiresnixUser?.id || null,
    student: {
      id: student.id,
      careerId: student.careerId,
      name: student.name,
      email: student.email,
      institutionId: student.institutionId,
      institutionName: student.institution?.institutionName,
    },
  });
});

// ── GET /api/inst-student/me ─────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const student = await InstitutionStudent.findByPk(req.instStudent.id, {
    attributes: { exclude: ['password'] },
    include: [
      { model: Institution, as: 'institution', attributes: ['institutionName','city','state','isPartner','logo','website'] },
    ],
  });
  res.json({ success: true, data: student });
});

// ── GET /api/inst-student/dashboard ─────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const sid = req.instStudent.id;

  const [batches, courses, certificates] = await Promise.all([
    // My batches
    Batch.findAll({
      include: [{ model: InstitutionStudent, as: 'students', where: { id: sid }, through: { attributes: [] }, required: true }],
    }),
    // My courses
    Course.findAll({
      include: [{ model: InstitutionStudent, as: 'students', where: { id: sid }, through: { attributes: ['status','enrolledAt','completedAt'] }, required: true }],
    }),
    // My certificates
    InstitutionCertificate.findAll({
      where: { studentId: sid, isValid: true },
      order: [['issuedAt','DESC']],
    }),
  ]);

  res.json({ success: true, data: { batches, courses, certificates } });
});

// ── GET /api/inst-student/certificates ──────────────────────────
const getCertificates = asyncHandler(async (req, res) => {
  const certs = await InstitutionCertificate.findAll({
    where: { studentId: req.instStudent.id, isValid: true },
    include: [{ model: Course, as: 'course', attributes: ['name'] }],
    order: [['issuedAt','DESC']],
  });
  res.json({ success: true, data: certs });
});

// ── PUT /api/inst-student/change-password ────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400); throw new Error('New password must be at least 6 characters');
  }
  const student = await InstitutionStudent.findByPk(req.instStudent.id);
  const match = await student.matchPassword(currentPassword);
  if (!match) { res.status(401); throw new Error('Current password is incorrect'); }
  await student.update({ password: newPassword });
  res.json({ success: true, message: 'Password updated successfully' });
});

// ── Academy Certificate PDF ──────────────────────────────────────
const downloadAcademyCertificate = asyncHandler(async (req, res) => {
  const student = req.instStudent;
  const { courseId } = req.params;

  const COURSE_NAMES = {
    python: 'Python Programming', javascript: 'JavaScript',
    java: 'Java', cpp: 'C++', dsa: 'Data Structures & Algorithms',
    sql: 'SQL & Databases', webdev: 'Full Stack Web Development',
  };

  const courseName = COURSE_NAMES[courseId] || courseId;
  const certNo = `HXAC-${student.careerId}-${courseId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const verifyUrl = `${process.env.CLIENT_URL || 'https://hiresnix.co.in'}/verify-academy/${certNo}`;
  const issuedDate = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
  const qrBuffer  = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Hiresnix_Academy_${courseName.replace(/\s+/g,'_')}_Certificate.pdf"`);

  const W = 841.89, H = 595.28;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);
  doc.on('error', (err) => { console.error('Academy PDF error:', err); });

  const NAVY   = '#0d1b2a';
  const GOLD   = '#f5a623';
  const WHITE  = '#ffffff';
  const LGREY  = '#94a3b8';
  const ORANGE = '#f5a623';

  // ── Full dark background ──────────────────────────────────────
  doc.rect(0, 0, W, H).fill(NAVY);

  // ── Outer gold border (thick) ─────────────────────────────────
  doc.rect(18, 18, W-36, H-36).lineWidth(4).stroke(GOLD);
  // Inner gold border (thin)
  doc.rect(26, 26, W-52, H-52).lineWidth(1.2).stroke(GOLD);

  // ── Top label ─────────────────────────────────────────────────
  doc.fillColor(ORANGE).fontSize(11).font('Helvetica-Bold')
     .text('HIRESNIX AI ACADEMY', 0, 50, { align: 'center' });

  // ── Title ─────────────────────────────────────────────────────
  doc.fillColor(WHITE).fontSize(36).font('Helvetica-Bold')
     .text('Certificate of Completion', 0, 80, { align: 'center' });

  // Gold divider
  doc.rect(W/2 - 130, 128, 260, 2).fill(GOLD);

  // ── Body ──────────────────────────────────────────────────────
  doc.fillColor(LGREY).fontSize(13).font('Helvetica')
     .text('This is to certify that', 0, 148, { align: 'center' });

  doc.fillColor(ORANGE).fontSize(32).font('Helvetica-Bold')
     .text(student.name, 0, 172, { align: 'center' });

  doc.fillColor(LGREY).fontSize(12).font('Helvetica')
     .text('has successfully completed the AI Academy course in', 0, 218, { align: 'center' });

  doc.fillColor(WHITE).fontSize(20).font('Helvetica-Bold')
     .text(courseName, 0, 244, { align: 'center' });

  doc.fillColor(LGREY).fontSize(11).font('Helvetica')
     .text(`Issued on ${issuedDate}  |  Hiresnix AI Academy`, 0, 278, { align: 'center' });

  doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
     .text(`Certificate No: ${certNo}`, 0, 298, { align: 'center' });
  doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
     .text(`Career ID: ${student.careerId}`, 0, 312, { align: 'center' });

  // ── QR Code ───────────────────────────────────────────────────
  const qrSize = 72;
  const qrX = W/2 - qrSize/2;
  const qrY = H - 175;
  doc.roundedRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 32, 6)
     .fillAndStroke('#ffffff', GOLD);
  doc.image(qrBuffer, qrX, qrY, { width: qrSize });
  doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold')
     .text('Scan to Verify', qrX - 4, qrY + qrSize + 4, { width: qrSize + 8, align: 'center' });
  doc.fillColor('#64748b').fontSize(5).font('Helvetica')
     .text(certNo, qrX - 4, qrY + qrSize + 15, { width: qrSize + 8, align: 'center' });

  // ── Signatures ────────────────────────────────────────────────
  const sigLineY2 = H - 100;
  const sigBlockW = 160;

  const sigFn = (doc2, name, title, company, blockX, imgPath, imgW, imgH, yOffset = -6) => {
    try {
      if (fs.existsSync(imgPath)) {
        const imgX = blockX + Math.floor((sigBlockW - imgW) / 2);
        const imgY = sigLineY2 - imgH + yOffset;
        doc2.image(imgPath, imgX, imgY, { width: imgW, height: imgH });
      }
    } catch(e) {}
    doc2.moveTo(blockX, sigLineY2).lineTo(blockX + sigBlockW, sigLineY2).lineWidth(0.8).stroke('#475569');
    doc2.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
        .text(name, blockX, sigLineY2 + 7, { width: sigBlockW, align: 'center' });
    doc2.fillColor(LGREY).fontSize(8.5).font('Helvetica')
        .text(title, blockX, sigLineY2 + 22, { width: sigBlockW, align: 'center' });
    doc2.fillColor('#475569').fontSize(7.5).font('Helvetica')
        .text(company, blockX, sigLineY2 + 35, { width: sigBlockW, align: 'center' });
  };

  sigFn(doc, 'Mr. Jayesh Badgujar', 'Program Director', 'Hiresnix',
        (W/2)-260, path.join(__dirname,'..','signatures','Director.png'), 130, 48);
  sigFn(doc, 'Mr. A S Borse', 'Founder & CEO', 'Hiresnix',
        (W/2)+100, path.join(__dirname,'..','signatures','ceo.png'), 155, 58, 2);

  // ── Footer ────────────────────────────────────────────────────
  doc.fillColor('#334155').fontSize(8).font('Helvetica')
     .text('support@hiresnix.co.in  |  www.hiresnix.co.in  |  Shirpur, Maharashtra, India',
           0, H - 38, { align: 'center' });

  doc.end();
});

// ── Academy Progress ─────────────────────────────────────────────
const saveAcademyProgress = asyncHandler(async (req, res) => {
  const student = req.instStudent;
  const { courseId, completed, xp, claimedCert } = req.body;
  if (!courseId) { res.status(400); throw new Error('courseId required'); }

  const { sequelize } = require('../models');
  await sequelize.query(`
    INSERT INTO inst_academy_progress (student_id, career_id, course_id, completed, xp, claimed_cert, last_active)
    VALUES (:studentId, :careerId, :courseId, :completed::jsonb, :xp, :claimedCert, NOW())
    ON CONFLICT (student_id, course_id)
    DO UPDATE SET
      completed = :completed::jsonb,
      xp = :xp,
      claimed_cert = :claimedCert,
      last_active = NOW()
  `, {
    replacements: {
      studentId: student.id,
      careerId: student.careerId,
      courseId,
      completed: JSON.stringify(completed || []),
      xp: xp || 0,
      claimedCert: claimedCert || false,
    },
    type: sequelize.QueryTypes.INSERT,
  });

  res.json({ success: true, message: 'Progress saved' });
});

const getAcademyProgress = asyncHandler(async (req, res) => {
  const student = req.instStudent;
  const { sequelize } = require('../models');
  const [rows] = await sequelize.query(
    `SELECT * FROM inst_academy_progress WHERE student_id = :studentId`,
    { replacements: { studentId: student.id }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ success: true, data: rows || [] });
});

// Admin: get all students academy progress
const getAllAcademyProgress = asyncHandler(async (req, res) => {
  const institutionId = req.institution?.id;
  const { sequelize } = require('../models');

  // Get all students of this institution with their academy progress
  const rows = await sequelize.query(`
    SELECT
      ist.id as student_id,
      ist."careerId",
      ist.name,
      ist.email,
      ist.department,
      COALESCE(
        json_agg(
          json_build_object(
            'courseId', ap.course_id,
            'completed', ap.completed,
            'xp', ap.xp,
            'claimedCert', ap.claimed_cert,
            'lastActive', ap.last_active
          )
        ) FILTER (WHERE ap.course_id IS NOT NULL),
        '[]'::json
      ) as academy
    FROM institution_students ist
    LEFT JOIN inst_academy_progress ap ON ap.student_id = ist.id
    WHERE ist."institutionId" = :institutionId
    GROUP BY ist.id, ist."careerId", ist.name, ist.email, ist.department
    ORDER BY ist.name
  `, {
    replacements: { institutionId },
    type: sequelize.QueryTypes.SELECT,
  });

  res.json({ success: true, data: rows || [] });
});

module.exports = { login, getMe, getDashboard, getCertificates, changePassword, protectInstStudent, saveAcademyProgress, getAcademyProgress, getAllAcademyProgress, downloadAcademyCertificate };