/**
 * controllers/authController.js
 */

const asyncHandler = require('express-async-handler');
const { User, Student, Company } = require('../models');
const { sequelize } = require('../config/db');
const {
  STUDENT_VERIFY_MESSAGE,
  createVerificationToken,
  sendStudentVerificationEmail,
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
      emailVerified: user.emailVerified,
    },
  });
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName, industry } = req.body;
  if (role === 'admin') { res.status(400); throw new Error('Admin cannot self-register'); }

  const cleanEmail = email.trim().toLowerCase();

  const exists = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail) });
  if (exists) { res.status(400); throw new Error('Email already registered'); }

  let user;
  await sequelize.transaction(async (transaction) => {
    const isStudent = role === 'student';
    user = await User.create({
      name,
      email: cleanEmail,
      password,
      role,
      // Existing users default to verified; new students are explicitly held for email verification.
      emailVerified: !isStudent,
      emailVerificationToken: isStudent ? createVerificationToken() : null,
      emailVerificationSentAt: isStudent ? new Date() : null,
    }, { transaction });

    if (isStudent) {
      await Student.create({ userId: user.id }, { transaction });
    } else if (role === 'company') {
      if (!companyName) { res.status(400); throw new Error('Company name is required'); }
      await Company.create({ userId: user.id, companyName, industry }, { transaction });
    }
  });

  if (role === 'student') {
    try {
      await sendStudentVerificationEmail(user);
    } catch (err) {
      await user.destroy();
      throw err;
    }
    return res.status(201).json({
      success: true,
      requiresVerification: true,
      message: STUDENT_VERIFY_MESSAGE,
    });
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
  if (user.role === 'student' && !user.emailVerified) {
    res.status(401); throw new Error('Please verify your email before logging in.');
  }

  sendToken(user, 200, res);
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password', 'emailVerificationToken'] },
  });
  let profile = null;
  if (user.role === 'student') profile = await Student.findOne({ where: { userId: user.id } });
  if (user.role === 'company') profile = await Company.findOne({ where: { userId: user.id } });
  res.json({ success: true, data: { user, profile } });
});

// POST /api/auth/verify-student-email
const verifyStudentEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) { res.status(400); throw new Error('Verification token is required'); }

  const user = await User.findOne({ where: { emailVerificationToken: token } });
  if (!user || user.role !== 'student') {
    res.status(400); throw new Error('Invalid or expired verification link');
  }

  await user.update({
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationSentAt: null,
  });

  res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
});

// POST /api/auth/resend-student-verification
const resendStudentVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) { res.status(400); throw new Error('Email is required'); }

  const cleanEmail = email.trim().toLowerCase();
  const user = await User.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail) });

  if (!user || user.role !== 'student' || user.emailVerified) {
    return res.json({ success: true, message: STUDENT_VERIFY_MESSAGE });
  }

  // Rotate the token on resend so old email links cannot be reused indefinitely.
  user.emailVerificationToken = createVerificationToken();
  user.emailVerificationSentAt = new Date();
  await user.save();
  await sendStudentVerificationEmail(user);

  res.json({ success: true, message: STUDENT_VERIFY_MESSAGE });
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

module.exports = {
  register,
  login,
  getMe,
  updatePassword,
  verifyStudentEmail,
  resendStudentVerification,
};
