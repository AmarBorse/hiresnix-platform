/**
 * controllers/authController.js
 */

const asyncHandler = require('express-async-handler');
const { User, Student, Company } = require('../models');
const { sequelize } = require('../config/db');

const sendToken = (user, code, res) => {
  const token = user.getSignedJwtToken();
  res.status(code).json({
    success: true, token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, isApproved: user.isApproved },
  });
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName, industry } = req.body;
  if (role === 'admin') { res.status(400); throw new Error('Admin cannot self-register'); }

  const cleanEmail = email.trim().toLowerCase();

  const exists = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail) });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  const user = await User.create({ name, email: cleanEmail, password, role });

  if (role === 'student') {
    await Student.create({ userId: user.id });
  } else if (role === 'company') {
    if (!companyName) { res.status(400); throw new Error('Company name is required'); }
    await Company.create({ userId: user.id, companyName, industry });
  }

  sendToken(user, 201, res);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Provide email and password'); }

  const cleanEmail = email.trim().toLowerCase();

  const user = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail) });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid credentials');
  }
  if (!user.isActive) { res.status(401); throw new Error('Account deactivated. Contact admin.'); }

  sendToken(user, 200, res);
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
  let profile = null;
  if (user.role === 'student') profile = await Student.findOne({ where: { userId: user.id } });
  if (user.role === 'company') profile = await Company.findOne({ where: { userId: user.id } });
  res.json({ success: true, data: { user, profile } });
});

// PUT /api/auth/updatepassword
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findByPk(req.user.id);
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

module.exports = { register, login, getMe, updatePassword };
