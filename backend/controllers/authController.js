/**
 * controllers/authController.js
 * Added: institution registration support
 */

const asyncHandler = require('express-async-handler');
const { User, Student, Company, Institution } = require('../models');
const { sequelize } = require('../config/db');
const { updateUserPassword } = require('../utils/passwords');

const sendToken = (user, code, res) => {
  const token = user.getSignedJwtToken();
  res.status(code).json({
    success: true, token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
    },
  });
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName, industry, institutionName, type: instType } = req.body;
  if (role === 'admin') { res.status(400); throw new Error('Admin cannot self-register'); }

  const cleanEmail = email.trim().toLowerCase();
  const exists = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail) });
  if (exists) {
    // Check if this is an inst-student linked account — if so, just update it instead of blocking
    const { InstitutionStudent } = require('../models');
    const instStudent = await InstitutionStudent.findOne({ where: { email: cleanEmail } });
    if (instStudent && exists.role === 'student') {
      // Update the linked account with new password and mark as real student
      exists.name = name;
      exists.password = password; // will be hashed by beforeUpdate hook
      await exists.save();
      return sendToken(exists, 200, res);
    }
    res.status(400); throw new Error('Email already registered');
  }

  let user;
  await sequelize.transaction(async (transaction) => {
    // Institution accounts start NOT approved — pending admin review
    const isApproved = role === 'institution' ? false : false; // both company and institution need approval
    user = await User.create({ name, email: cleanEmail, password, role, isApproved }, { transaction });

    if (role === 'student') {
      await Student.create({ userId: user.id }, { transaction });
    } else if (role === 'company') {
      if (!companyName) { res.status(400); throw new Error('Company name is required'); }
      await Company.create({ userId: user.id, companyName, industry }, { transaction });
    } else if (role === 'institution') {
      if (!institutionName) { res.status(400); throw new Error('Institution name is required'); }
      await Institution.create({ userId: user.id, institutionName, type: instType || null }, { transaction });
    }
  });

  if (role === 'institution') {
    // Return success but NOT a token — they must wait for approval
    return res.status(201).json({
      success: true,
      message: 'Registration submitted. Your account is pending admin approval. You will be notified once approved.',
      pendingApproval: true,
    });
  }

  sendToken(user, 201, res);
});

// In-memory login attempt tracker (resets on server restart)
// Key: email, Value: { count, lockedUntil }
const loginAttempts = new Map();
const MAX_ATTEMPTS = 10;
const LOCK_DURATION = 2 * 60 * 1000; // 15 minutes

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Provide email and password'); }

  const cleanEmail = email.trim().toLowerCase();

  // Check lockout
  const attempt = loginAttempts.get(cleanEmail);
  if (attempt?.lockedUntil && Date.now() < attempt.lockedUntil) {
    const minsLeft = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    res.status(429);
    throw new Error(`Account locked due to too many failed attempts. Try again in ${minsLeft} minute(s).`);
  }

  const user = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail) });

  if (!user || !(await user.matchPassword(password))) {
    // Track failed attempt
    const current = loginAttempts.get(cleanEmail) || { count: 0 };
    current.count += 1;
    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCK_DURATION;
      current.count = 0;
      loginAttempts.set(cleanEmail, current);
      res.status(429);
      throw new Error(`Too many failed attempts. Account locked for 2 minutes.`);
    }
    loginAttempts.set(cleanEmail, current);
    const remaining = MAX_ATTEMPTS - current.count;
    res.status(401);
    throw new Error(`Invalid credentials. ${remaining} attempt(s) remaining before lockout.`);
  }

  // Success - clear attempts
  loginAttempts.delete(cleanEmail);

  if (!user.isActive) { res.status(401); throw new Error('Account deactivated. Contact admin.'); }

  // Institution: block login if not approved
  if (user.role === 'institution' && !user.isApproved) {
    res.status(403);
    throw new Error('Your institution account is pending admin approval. Please wait for approval.');
  }

  sendToken(user, 200, res);
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password', 'emailVerificationToken'] } });
  let profile = null;
  if (user.role === 'student')     profile = await Student.findOne({ where: { userId: user.id } });
  if (user.role === 'company')     profile = await Company.findOne({ where: { userId: user.id } });
  if (user.role === 'institution') profile = await Institution.findOne({ where: { userId: user.id } });
  res.json({ success: true, data: { user, profile } });
});

// PUT /api/auth/updatepassword
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) { res.status(400); throw new Error('Password must be at least 8 characters'); }
  const user = await User.findByPk(req.user.id);
  if (!(await user.matchPassword(currentPassword))) { res.status(401); throw new Error('Current password is incorrect'); }
  await updateUserPassword(user, newPassword);
  sendToken(user, 200, res);
});

module.exports = { register, login, getMe, updatePassword };