/**
 * controllers/authController.js
 * Added: institution registration support
 */

const asyncHandler = require('express-async-handler');
const { User, Student, Company, Institution } = require('../models');
const { sequelize } = require('../config/db');
const { updateUserPassword } = require('../utils/passwords');
const {
  createVerificationToken,
  sendStudentVerificationEmail,
  STUDENT_VERIFY_SENT_MESSAGE,
} = require('../utils/studentEmailVerification');

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
  if (exists) { res.status(400); throw new Error('Email already registered'); }

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
    return res.status(201).json({
      success: true,
      message: 'Registration submitted. Your account is pending admin approval. You will be notified once approved.',
      pendingApproval: true,
    });
  }

  // Student email verification
  // If student provided Career ID - link to institution
  if (role === 'student' && req.body.careerId) {
    try {
      const { InstitutionStudent } = require('../models');
      const instStudent = await InstitutionStudent.findOne({
        where: { careerId: req.body.careerId.trim().toUpperCase() }
      });
      if (instStudent) {
        // Update inst student with linked user id
        await instStudent.update({ linkedUserId: user.id });
        // Update user password to match
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(req.body.password, 10);
        await instStudent.update({ password: hashed });
        console.log(`Linked user ${user.id} to inst student ${instStudent.careerId}`);
      }
    } catch (err) {
      console.error('Career ID link failed:', err.message);
    }
  }

  if (role === 'student') {
    try {
      const token = createVerificationToken();
      await user.update({
        emailVerified: false,
        emailVerificationToken: token,
        emailVerificationSentAt: new Date(),
      });
      await sendStudentVerificationEmail({ ...user.toJSON(), emailVerificationToken: token });
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        emailVerificationSent: true,
      });
    } catch (emailErr) {
      console.error('Verification email failed:', emailErr.message);
      // Still register but warn
      return res.status(201).json({
        success: true,
        message: 'Registration successful! (Email verification unavailable, contact admin.)',
        emailVerificationSent: false,
      });
    }
  }

  sendToken(user, 201, res);
});

// In-memory login attempt tracker (resets on server restart)
// Key: email, Value: { count, lockedUntil }
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

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
      throw new Error(`Too many failed attempts. Account locked for 15 minutes.`);
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

// GET /api/auth/verify-email?token=xxx
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) { res.status(400); throw new Error('Verification token required'); }

  const user = await User.findOne({ where: { emailVerificationToken: token } });
  if (!user) { res.status(400); throw new Error('Invalid or expired verification link'); }

  // Check token not older than 24 hours
  const tokenAge = Date.now() - new Date(user.emailVerificationSentAt).getTime();
  if (tokenAge > 24 * 60 * 60 * 1000) {
    res.status(400); throw new Error('Verification link expired. Please register again or contact support.');
  }

  await user.update({
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationSentAt: null,
  });

  res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
});

// POST /api/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email required'); }

  const user = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), email.trim().toLowerCase()) });
  if (!user) { res.status(404); throw new Error('No account found with this email'); }
  if (user.emailVerified) { res.status(400); throw new Error('Email already verified'); }

  const token = createVerificationToken();
  await user.update({
    emailVerificationToken: token,
    emailVerificationSentAt: new Date(),
  });
  await sendStudentVerificationEmail({ ...user.toJSON(), emailVerificationToken: token });

  res.json({ success: true, message: STUDENT_VERIFY_SENT_MESSAGE });
});

// Admin: clear lockout for specific email
const clearLockout = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email required'); }
  loginAttempts.delete(email.trim().toLowerCase());
  res.json({ success: true, message: `Lockout cleared for ${email}` });
});

// Admin: clear ALL lockouts
const clearAllLockouts = asyncHandler(async (req, res) => {
  loginAttempts.clear();
  res.json({ success: true, message: 'All lockouts cleared' });
});

module.exports = { register, login, getMe, updatePassword, verifyEmail, resendVerification, clearLockout, clearAllLockouts };