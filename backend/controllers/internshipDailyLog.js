/**
 * controllers/internshipDailyLog.js
 * New controller for Daily Internship Logs
 * Add: require('./controllers/internshipDailyLog') in routes
 */

const asyncHandler = require('express-async-handler');
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

// ── MODEL (inline to avoid circular deps) ────────────────────────
let DailyLog;
const getDailyLogModel = () => {
  if (DailyLog) return DailyLog;
  try {
    DailyLog = sequelize.model('DailyLog');
    return DailyLog;
  } catch {}
  DailyLog = sequelize.define('DailyLog', {
    id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    enrollmentId:  { type: DataTypes.BIGINT, allowNull: false },
    userId:        { type: DataTypes.BIGINT, allowNull: false },
    logDate:       { type: DataTypes.DATEONLY, allowNull: false },
    todaysWork:    { type: DataTypes.TEXT },
    hoursWorked:   { type: DataTypes.DECIMAL(4, 1), defaultValue: 0 },
    learning:      { type: DataTypes.TEXT },
    challenges:    { type: DataTypes.TEXT },
    tomorrowPlan:  { type: DataTypes.TEXT },
  }, { tableName: 'ip_daily_logs', timestamps: true });

  // Auto-sync table if missing
  DailyLog.sync({ alter: false }).catch(() =>
    sequelize.getQueryInterface().createTable('ip_daily_logs', {
      id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      enrollmentId: { type: DataTypes.BIGINT, allowNull: false },
      userId:       { type: DataTypes.BIGINT, allowNull: false },
      logDate:      { type: DataTypes.DATEONLY, allowNull: false },
      todaysWork:   { type: DataTypes.TEXT },
      hoursWorked:  { type: DataTypes.DECIMAL(4, 1), defaultValue: 0 },
      learning:     { type: DataTypes.TEXT },
      challenges:   { type: DataTypes.TEXT },
      tomorrowPlan: { type: DataTypes.TEXT },
      createdAt:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt:    { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }).catch(() => {})
  );
  return DailyLog;
};

// ── SUBMIT / UPDATE DAILY LOG ─────────────────────────────────────
const submitDailyLog = asyncHandler(async (req, res) => {
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  const DL = getDailyLogModel();

  const enrollment = await InternshipEnrollment.findOne({
    where: { userId: req.user.id, status: { [Op.in]: ['Active', 'Completed'] } },
  });
  if (!enrollment) {
    res.status(404);
    throw new Error('No active enrollment found');
  }

  const today = new Date().toISOString().slice(0, 10);
  const { todaysWork, hoursWorked, learning, challenges, tomorrowPlan } = req.body;

  const [log, created] = await DL.findOrCreate({
    where: { enrollmentId: enrollment.id, logDate: today },
    defaults: { userId: req.user.id, todaysWork, hoursWorked: hoursWorked || 0, learning, challenges, tomorrowPlan },
  });

  if (!created) {
    await log.update({ todaysWork, hoursWorked: hoursWorked || 0, learning, challenges, tomorrowPlan });
  }

  res.json({ success: true, data: log, message: created ? 'Daily log saved!' : 'Daily log updated!' });
});

// ── GET MY LOGS ───────────────────────────────────────────────────
const getMyDailyLogs = asyncHandler(async (req, res) => {
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  const DL = getDailyLogModel();

  const enrollment = await InternshipEnrollment.findOne({
    where: { userId: req.user.id, status: { [Op.in]: ['Active', 'Completed'] } },
  });
  if (!enrollment) return res.json({ success: true, data: [] });

  const logs = await DL.findAll({
    where: { enrollmentId: enrollment.id },
    order: [['logDate', 'DESC']],
  });
  res.json({ success: true, data: logs });
});

// ── CREATE RAZORPAY ORDER FOR CERT PAYMENT ────────────────────────
const createCertPaymentOrder = asyncHandler(async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(503);
    throw new Error('Payment service not configured');
  }
  const Razorpay = require('razorpay');
  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: 10000, // ₹100 in paise
    currency: 'INR',
    receipt: `cert_${req.user.id}_${Date.now()}`,
    notes: { userId: req.user.id, purpose: 'internship_certificate' },
  });
  res.json({ success: true, data: { orderId: order.id, keyId, amount: order.amount } });
});

// ── VERIFY PAYMENT & UNLOCK CERTS ────────────────────────────────
const verifyCertPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keySecret) {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    if (expected !== razorpay_signature) {
      res.status(400);
      throw new Error('Payment verification failed');
    }
  }

  // Mark enrollment cert as paid
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  const enrollment = await InternshipEnrollment.findOne({
    where: { userId: req.user.id, status: 'Completed' },
  });
  if (enrollment) {
    // Store payment status in taskLogs metadata (no schema change needed)
    const meta = enrollment.completedTasks || [];
    const alreadyPaid = meta.find((m) => m._type === 'cert_payment');
    if (!alreadyPaid) {
      await enrollment.update({
        completedTasks: [...meta, {
          _type: 'cert_payment',
          paidAt: new Date().toISOString(),
          paymentId: razorpay_payment_id,
        }],
      });
    }
  }

  res.json({ success: true, message: 'Payment verified. Certificates unlocked!' });
});

// ── CHECK IF CERT IS PAID (or legacy) ────────────────────────────
const checkCertPaymentStatus = asyncHandler(async (req, res) => {
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  const enrollment = await InternshipEnrollment.findOne({
    where: { userId: req.user.id, status: 'Completed' },
  });
  if (!enrollment) return res.json({ success: true, paid: false, isLegacy: false });

  // Legacy = enrolled before Aug 7, 2026 (payment system deploy date)
  const PAYMENT_CUTOFF = new Date('2026-08-07T00:00:00.000Z');
  const enrolledAt = new Date(enrollment.createdAt);
  const isLegacy = enrolledAt < PAYMENT_CUTOFF;

  const meta = enrollment.completedTasks || [];
  const paid = !!meta.find((m) => m._type === 'cert_payment');

  res.json({ success: true, paid: paid || isLegacy, isLegacy });
});

module.exports = {
  submitDailyLog,
  getMyDailyLogs,
  createCertPaymentOrder,
  verifyCertPayment,
  checkCertPaymentStatus,
};