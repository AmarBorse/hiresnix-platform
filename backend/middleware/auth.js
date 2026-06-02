/**
 * middleware/auth.js — JWT Authentication & Role Authorization
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { User } = require('../models');
const { STUDENT_UNVERIFIED_MESSAGE } = require('../utils/studentEmailVerification');

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) { res.status(401); throw new Error('Not authorized — no token provided'); }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    if (!req.user)         { res.status(401); throw new Error('User not found'); }
    if (!req.user.isActive){ res.status(401); throw new Error('Account has been deactivated'); }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Token invalid or expired');
  }
});

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user.role}' is not authorized for this action`);
  }
  if (req.user.role === 'student' && roles.includes('student') && req.user.emailVerified === false) {
    res.status(403);
    throw new Error(STUDENT_UNVERIFIED_MESSAGE);
  }
  next();
};

const requireApproved = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'company' && !req.user.isApproved) {
    res.status(403);
    throw new Error('Company account pending admin approval');
  }
  next();
});

module.exports = { protect, authorize, requireApproved };
