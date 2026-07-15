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

  // Update inst student password
  await student.update({ password: newPassword });

  // ── Auto-register/update on Hiresnix internship portal ──────────
  // Use real email if available, else synthetic
  const registrationEmail = student.email && !student.email.includes('@inst.hiresnix.co.in')
    ? student.email.trim().toLowerCase()
    : `${student.careerId.toLowerCase()}@inst.hiresnix.co.in`;

  try {
    let hiresnixUser = await User.findOne({ where: { email: registrationEmail } });

    if (!hiresnixUser) {
      // First time password change — register on internship portal
      hiresnixUser = await User.create({
        name: student.name,
        email: registrationEmail,
        password: newPassword,  // same password
        role: 'student',
        isActive: true,
        isApproved: true,
      });

      const { Student } = require('../models');
      await Student.findOrCreate({
        where: { userId: hiresnixUser.id },
        defaults: { userId: hiresnixUser.id, isProfileComplete: false },
      });
    } else {
      // Already registered — just sync the password
      hiresnixUser.password = newPassword;
      await hiresnixUser.save();
    }

    // Mark student as registered on internship portal
    await student.update({ hiresnixUserId: hiresnixUser.id });

  } catch(e) {
    console.error('Auto-register on internship portal failed:', e.message);
    // Don't fail the password change even if registration fails
  }

  res.json({
    success: true,
    message: 'Password updated successfully. You can now login to the internship portal with your email and this password.',
    internshipEmail: registrationEmail,
  });
});

// ── Academy Certificate PDF ──────────────────────────────────────
const downloadAcademyCertificate = asyncHandler(async (req, res) => {
  const student = req.instStudent;
  const { courseId } = req.params;

  const COURSE_NAMES = {
    python: 'Python Programming', javascript: 'JavaScript',
    java: 'Java', cpp: 'C++', dsa: 'Data Structures & Algorithms',
    sql: 'SQL & Databases', webdev: 'Full Stack Web Development',
    react: 'React.js', nodejs: 'Node.js', datascience: 'Data Science',
    ml: 'Machine Learning', git: 'Git & Version Control',
    docker: 'Docker & DevOps', cybersecurity: 'Cybersecurity',
    flutter: 'Flutter Development', c: 'C Programming',
  };

  const courseName = COURSE_NAMES[courseId] || courseId.charAt(0).toUpperCase() + courseId.slice(1);
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

  // ── Full dark background ──────────────────────────────────────
  doc.rect(0, 0, W, H).fill(NAVY);

  // ── Corner decorations ────────────────────────────────────────
  const corner = (x, y, flip) => {
    const s = 40;
    doc.moveTo(x, y).lineTo(x + (flip ? -s : s), y).lineWidth(3).stroke(GOLD);
    doc.moveTo(x, y).lineTo(x, y + (flip ? -s : s)).lineWidth(3).stroke(GOLD);
  };
  corner(28, 28, false); corner(W-28, 28, true);
  corner(28, H-28, false); corner(W-28, H-28, true);

  // ── Outer gold border ─────────────────────────────────────────
  doc.rect(20, 20, W-40, H-40).lineWidth(2.5).stroke(GOLD);
  doc.rect(28, 28, W-56, H-56).lineWidth(0.8).stroke(GOLD);

  // ── Top label ─────────────────────────────────────────────────
  doc.fillColor(GOLD).fontSize(10).font('Helvetica-Bold')
     .text('HIRESNIX AI ACADEMY', 0, 48, { align: 'center', characterSpacing: 2 });

  // ── Title ─────────────────────────────────────────────────────
  doc.fillColor(WHITE).fontSize(38).font('Helvetica-Bold')
     .text('Certificate of Completion', 0, 72, { align: 'center' });

  // Gold divider line
  doc.moveTo(W/2 - 140, 122).lineTo(W/2 + 140, 122).lineWidth(1.5).stroke(GOLD);

  // ── Body ──────────────────────────────────────────────────────
  doc.fillColor(LGREY).fontSize(12).font('Helvetica')
     .text('This is to certify that', 0, 140, { align: 'center' });

  doc.fillColor(GOLD).fontSize(34).font('Helvetica-Bold')
     .text(student.name, 0, 162, { align: 'center' });

  // Underline under name
  const nameWidth = Math.min(student.name.length * 18, 400);
  doc.moveTo(W/2 - nameWidth/2, 204).lineTo(W/2 + nameWidth/2, 204).lineWidth(0.8).stroke(GOLD);

  doc.fillColor(LGREY).fontSize(12).font('Helvetica')
     .text('has successfully completed the AI Academy course in', 0, 216, { align: 'center' });

  doc.fillColor(WHITE).fontSize(22).font('Helvetica-Bold')
     .text(courseName, 0, 240, { align: 'center' });

  doc.fillColor(LGREY).fontSize(10.5).font('Helvetica')
     .text(`Issued on ${issuedDate}  ·  Hiresnix AI Academy, Shirpur, Maharashtra`, 0, 274, { align: 'center' });

  doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
     .text(`Certificate No: ${certNo}`, 0, 294, { align: 'center' });
  doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
     .text(`Career ID: ${student.careerId}`, 0, 307, { align: 'center' });

  // ── QR Code ───────────────────────────────────────────────────
  const qrSize = 68;
  const qrX = W/2 - qrSize/2;
  const qrY = H - 168;
  // QR white bg only (no visible box border on dark)
  doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 28, 5)
     .fillAndStroke('#ffffff', GOLD);
  doc.image(qrBuffer, qrX, qrY, { width: qrSize });
  doc.fillColor('#1e293b').fontSize(6.5).font('Helvetica-Bold')
     .text('Scan to Verify', qrX - 4, qrY + qrSize + 3, { width: qrSize + 8, align: 'center' });

  // ── Signatures ────────────────────────────────────────────────
  const sigLineY2 = H - 96;
  const sigBlockW = 160;

  const sigFn = (doc2, name, title, company, blockX, imgPath, imgW, imgH, yOffset = -6) => {
    try {
      if (fs.existsSync(imgPath)) {
        const imgX = blockX + Math.floor((sigBlockW - imgW) / 2);
        const imgY = sigLineY2 - imgH + yOffset;
        // Draw image directly — no white background box
        doc2.image(imgPath, imgX, imgY, { width: imgW, height: imgH });
      }
    } catch(e) {}
    doc2.moveTo(blockX, sigLineY2).lineTo(blockX + sigBlockW, sigLineY2).lineWidth(0.8).stroke('#475569');
    doc2.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
        .text(name, blockX, sigLineY2 + 7, { width: sigBlockW, align: 'center' });
    doc2.fillColor(LGREY).fontSize(8.5).font('Helvetica')
        .text(title, blockX, sigLineY2 + 22, { width: sigBlockW, align: 'center' });
    doc2.fillColor('#4a5568').fontSize(7.5).font('Helvetica')
        .text(company, blockX, sigLineY2 + 35, { width: sigBlockW, align: 'center' });
  };

  sigFn(doc, 'Mr. Jayesh Badgujar', 'Program Director', 'Hiresnix',
        (W/2)-260, path.join(__dirname,'..','signatures','Director.png'), 130, 48);
  sigFn(doc, 'Mr. A S Borse', 'Founder & CEO', 'Hiresnix',
        (W/2)+100, path.join(__dirname,'..','signatures','ceo.png'), 155, 58, 2);

  // ── Footer ────────────────────────────────────────────────────
  doc.moveTo(40, H-36).lineTo(W-40, H-36).lineWidth(0.5).stroke('#2d3748');
  doc.fillColor('#4a5568').fontSize(7.5).font('Helvetica')
     .text('support@hiresnix.co.in  ·  www.hiresnix.co.in  ·  Shirpur, Maharashtra, India',
           0, H - 30, { align: 'center' });

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