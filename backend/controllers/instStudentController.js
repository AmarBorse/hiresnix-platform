/**
 * controllers/instStudentController.js
 * Institution Student Portal — Login + Dashboard
 */
const asyncHandler = require('express-async-handler');
const jwt          = require('jsonwebtoken');
const { Op }       = require('sequelize');
const {
  InstitutionStudent, Institution,
  Batch, BatchStudent, Course, CourseStudent, InstitutionCertificate,
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
    include: [{ model: Institution, as: 'institution', attributes: ['institutionName','isVerified'] }],
  });

  if (!student || !student.password) {
    res.status(401); throw new Error('Invalid Career ID or password');
  }

  const match = await student.matchPassword(password);
  if (!match) { res.status(401); throw new Error('Invalid Career ID or password'); }

  // Update last login
  await student.update({ lastLogin: new Date() });

  const token = signToken(student);
  res.json({
    success: true,
    token,
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

module.exports = { login, getMe, getDashboard, getCertificates, changePassword, protectInstStudent };
