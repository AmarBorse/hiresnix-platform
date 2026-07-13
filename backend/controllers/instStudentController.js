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
  const student = req.student;
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
  res.setHeader('Content-Disposition', `attachment; filename="Academy_${courseName.replace(/\s+/g,'_')}_${student.careerId}.pdf"`);

  const W = 841.89, H = 595.28;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  const GOLD = '#d4af37';
  const DARK = '#0f172a';
  const ACCENT = '#6366f1';

  // ── Outer border ──────────────────────────────────────────────
  doc.rect(20, 20, W-40, H-40).lineWidth(3).stroke(GOLD);
  doc.rect(26, 26, W-52, H-52).lineWidth(1).stroke(GOLD);

  // ── Dark Header ───────────────────────────────────────────────
  doc.rect(20, 20, W-40, 90).fill(DARK);

  // Logo area
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('Hiresnix', 50, 35);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica').text('Empowering Future Professionals', 50, 62);

  // Right header text
  doc.fillColor('#818cf8').fontSize(11).font('Helvetica-Bold')
     .text('AI ACADEMY — CERTIFICATE OF COMPLETION', 0, 52, { align: 'right', width: W-50 });

  // Gold diamonds
  const diamond = (x, y, s) => doc.moveTo(x,y-s).lineTo(x+s,y).lineTo(x,y+s).lineTo(x-s,y).fillColor(GOLD).fill();
  diamond(35, 70, 6); diamond(W-35, 70, 6);

  // ── Title ─────────────────────────────────────────────────────
  doc.fillColor(DARK).fontSize(34).font('Helvetica-Bold')
     .text('Certificate of Completion', 0, 130, { align: 'center' });

  // Gold divider
  doc.rect(W/2-120, 178, 240, 2).fill(GOLD);

  // ── Body ──────────────────────────────────────────────────────
  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text('This is to certify that', 0, 196, { align: 'center' });

  doc.fillColor(DARK).fontSize(30).font('Helvetica-Bold')
     .text(student.name, 0, 218, { align: 'center' });

  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text('has successfully completed the AI Academy course in', 0, 262, { align: 'center' });

  doc.fillColor(ACCENT).fontSize(18).font('Helvetica-Bold')
     .text(courseName, 0, 286, { align: 'center' });

  doc.fillColor('#475569').fontSize(12).font('Helvetica')
     .text(`at Hiresnix AI Academy  |  Issued on ${issuedDate}`, 0, 316, { align: 'center' });

  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
     .text(`Certificate No: ${certNo}`, 0, 338, { align: 'center' });

  doc.fillColor('#334155').fontSize(9).font('Helvetica')
     .text(`Career ID: ${student.careerId}`, 0, 352, { align: 'center' });

  // ── QR Code ───────────────────────────────────────────────────
  const qrSize = 75;
  const qrX = W/2 - qrSize/2;
  const qrY = H - 170;
  doc.roundedRect(qrX-9, qrY-9, qrSize+18, qrSize+36, 6).fillAndStroke('#ffffff', GOLD);
  doc.image(qrBuffer, qrX, qrY, { width: qrSize });
  doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold')
     .text('Scan to Verify', qrX-4, qrY+qrSize+4, { width: qrSize+8, align: 'center' });
  doc.fillColor('#64748b').fontSize(5.5).font('Helvetica')
     .text(certNo, qrX-4, qrY+qrSize+15, { width: qrSize+8, align: 'center' });

  // ── Signatures ────────────────────────────────────────────────
  const sigY = H - 130;
  const sig1X = W/2 - 270;
  const sig2X = W/2 + 110;
  const sigW  = 150;
  const sigImgH = 40;

  const dirSigPath = path.join(__dirname, '..', 'signatures', 'Director.png');
  const ceoSigPath = path.join(__dirname, '..', 'signatures', 'ceo.png');

  try { if (fs.existsSync(dirSigPath)) doc.image(dirSigPath, sig1X+20, sigY-sigImgH-2, { height: sigImgH, fit: [sigW-20, sigImgH] }); } catch(e) {}
  doc.moveTo(sig1X, sigY+2).lineTo(sig1X+sigW, sigY+2).lineWidth(0.8).stroke('#94a3b8');
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Mr.Jayesh Badgujar', sig1X, sigY+7, { width: sigW, align: 'center' });
  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Program Director', sig1X, sigY+21, { width: sigW, align: 'center' });

  try { if (fs.existsSync(ceoSigPath)) doc.image(ceoSigPath, sig2X+20, sigY-sigImgH-2, { height: sigImgH, fit: [sigW-20, sigImgH] }); } catch(e) {}
  doc.moveTo(sig2X, sigY+2).lineTo(sig2X+sigW, sigY+2).lineWidth(0.8).stroke('#94a3b8');
  doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text('Mr.A S Borse', sig2X, sigY+7, { width: sigW, align: 'center' });
  doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Founder & CEO, Hiresnix', sig2X, sigY+21, { width: sigW, align: 'center' });

  // ── Dark Footer ───────────────────────────────────────────────
  doc.rect(20, H-58, W-40, 38).fill(DARK);
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
     .text('support@hiresnix.co.in  |  www.hiresnix.co.in  |  Shirpur, Maharashtra, India', 0, H-45, { align: 'center' });

  doc.end();
});

// ── Academy Progress ─────────────────────────────────────────────
const saveAcademyProgress = asyncHandler(async (req, res) => {
  const student = req.student;
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
  const student = req.student;
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