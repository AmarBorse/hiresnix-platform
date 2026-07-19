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

// Manual student account creation (for fixing access issues)
r.post('/create-student-account', ...admin, async (req, res) => {
  try {
    const { User, Student } = require('../models');
    const bcrypt = require('bcryptjs');
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password required' });
    }
    let user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (user) {
      // Update password only
      const hashed = await bcrypt.hash(password, 10);
      await user.update({ password: hashed, isActive: true, isApproved: true, emailVerified: true });
      return res.json({ success: true, message: 'Account updated', userId: user.id });
    }
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({
      name, email: email.trim().toLowerCase(),
      password: hashed, role: 'student',
      isActive: true, isApproved: true, emailVerified: true,
    });
    await Student.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id, isProfileComplete: false },
    });
    res.json({ success: true, message: 'Account created', userId: user.id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Enquiries
r.get('/enquiries',              ...admin, getAllEnquiries);
r.put('/enquiries/:id/read',     ...admin, markAsRead);
r.delete('/enquiries/:id',       ...admin, deleteEnquiry);

// AI Academy Progress
r.get('/academy-progress',       ...admin, getAllAcademyProgress);

module.exports = r;