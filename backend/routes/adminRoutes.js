// routes/adminRoutes.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  verifyCompany, getAdminAnalytics,
  getInstitutions, getInstitution, approveInstitution, rejectInstitution, deleteInstitution,
  resetInstitutionPassword, resetInstStudentPassword, resetAllStudentPasswords,
} = require('../controllers/adminController');
const { getAllEnquiries, markAsRead, deleteEnquiry } = require('../controllers/enquiryController');
const { getAllAcademyProgress } = require('../controllers/instStudentController');
const r = express.Router();

const admin = [protect, authorize('admin')];

r.get('/analytics',                              ...admin, getAdminAnalytics);
r.put('/companies/:id/verify',                   ...admin, verifyCompany);

// Institution management
r.get('/institutions',                           ...admin, getInstitutions);
r.get('/institutions/:id',                       ...admin, getInstitution);
r.put('/institutions/:id/approve',               ...admin, approveInstitution);
r.put('/institutions/:id/reject',                ...admin, rejectInstitution);
r.delete('/institutions/:id',                    ...admin, deleteInstitution);

// Password resets
r.put('/institutions/:id/reset-password',        ...admin, resetInstitutionPassword);
r.put('/institutions/:id/reset-student-password',...admin, resetInstStudentPassword);
r.put('/institutions/:id/reset-all-passwords',   ...admin, resetAllStudentPasswords);

// Institution student management (admin)
r.get('/institutions/:id/students', ...admin, async (req, res) => {
  const { sequelize } = require('../config/db');
  const { InstitutionStudent } = require('../models');
  const students = await InstitutionStudent.findAll({
    where: { institutionId: req.params.id },
    attributes: ['id', 'name', 'careerId', 'email', 'department'],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: students });
});

// Enquiries
r.get('/enquiries',              ...admin, getAllEnquiries);
r.put('/enquiries/:id/read',     ...admin, markAsRead);
r.delete('/enquiries/:id',       ...admin, deleteEnquiry);

// AI Academy Progress
r.get('/academy-progress',       ...admin, getAllAcademyProgress);

// ── Reset institution student passwords ──────────────────────────
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const asyncHandler = require('express-async-handler');

r.post('/reset-inst-passwords', ...admin, asyncHandler(async (req, res) => {
  // Get all institution students
  const students = await sequelize.query(
    `SELECT id, "careerId" FROM institution_students ORDER BY id ASC`,
    { type: sequelize.QueryTypes.SELECT }
  );

  let updated = 0;
  for (const s of students) {
    // Generate password from careerId last segment e.g. HX-HIR-2026-0001 → HX@0001
    const parts = (s.careerId || '').split('-');
    const seq = parts[parts.length - 1] || '0001';
    const plain = `HX@${seq}`;
    const hashed = await bcrypt.hash(plain, 10);
    await sequelize.query(
      `UPDATE institution_students SET password = :pwd WHERE id = :id`,
      { replacements: { pwd: hashed, id: s.id }, type: sequelize.QueryTypes.UPDATE }
    );
    updated++;
  }

  res.json({ success: true, message: `Reset ${updated} students passwords`, updated });
}));

module.exports = r;
// ── SUB-ADMIN MANAGEMENT ──────────────────────────────────────────
const bcrypt = require('bcryptjs');

// GET all sub-admins
r.get('/sub-admins', ...admin, asyncHandler(async (req, res) => {
  const subAdmins = await User.findAll({
    where: { role: 'sub-admin' },
    attributes: ['id', 'name', 'email', 'isActive', 'createdAt'],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: subAdmins });
}));

// POST create sub-admin
r.post('/sub-admins', ...admin, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400); throw new Error('Name, email and password are required');
  }
  const exists = await User.findOne({ where: { email: email.toLowerCase() } });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  const user = await User.create({
    name, email: email.toLowerCase(),
    password, role: 'sub-admin',
    isActive: true, isApproved: true,
  });
  res.json({ success: true, message: 'Sub-admin created', data: { id: user.id, name: user.name, email: user.email } });
}));

// PUT toggle sub-admin active status
r.put('/sub-admins/:id/toggle', ...admin, asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { id: req.params.id, role: 'sub-admin' } });
  if (!user) { res.status(404); throw new Error('Sub-admin not found'); }
  await user.update({ isActive: !user.isActive });
  res.json({ success: true, message: `Sub-admin ${user.isActive ? 'enabled' : 'disabled'}`, isActive: user.isActive });
}));

// PUT reset sub-admin password
r.put('/sub-admins/:id/reset-password', ...admin, asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters'); }
  const user = await User.findOne({ where: { id: req.params.id, role: 'sub-admin' } });
  if (!user) { res.status(404); throw new Error('Sub-admin not found'); }
  await user.update({ password: newPassword });
  res.json({ success: true, message: 'Password reset successfully' });
}));

// DELETE sub-admin
r.delete('/sub-admins/:id', ...admin, asyncHandler(async (req, res) => {
  const user = await User.findOne({ where: { id: req.params.id, role: 'sub-admin' } });
  if (!user) { res.status(404); throw new Error('Sub-admin not found'); }
  await user.destroy();
  res.json({ success: true, message: 'Sub-admin deleted' });
}));