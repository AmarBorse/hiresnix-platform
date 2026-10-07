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

// ── CERTIFICATE PAYMENTS (₹100 via Razorpay) ───────────────────────
// See utils/certPayments.js. Certificates unlock when the server can confirm the
// payment: from the checkout callback, from a server-side check with Razorpay,
// from Razorpay's webhook, or by an admin (UTR verified against Razorpay, or manual).
const cp = require('../utils/certPayments');

// Students enrolled before the payment system went live get free certificates
const PAYMENT_CUTOFF = new Date('2026-08-06T18:29:59.000Z'); // Aug 6 2026, 11:59 PM IST
const isLegacyEnrollment = (enrollment) => new Date(enrollment.createdAt) < PAYMENT_CUTOFF;

// POST /iplatform/cert-payment-order
const createCertPaymentOrder = asyncHandler(async (req, res) => {
  const rz = cp.getRazorpay();
  if (!rz) { res.status(503); throw new Error('Payment service not configured'); }
  const enrollment = await cp.getCompletedEnrollment(req.user.id);
  if (!enrollment) { res.status(400); throw new Error('Complete your internship before unlocking certificates'); }
  if (cp.isPaid(enrollment) || isLegacyEnrollment(enrollment)) {
    return res.json({ success: true, alreadyPaid: true, message: 'Certificates are already unlocked' });
  }
  const order = await rz.client.orders.create({
    amount: cp.CERT_AMOUNT,
    currency: 'INR',
    receipt: `cert_${req.user.id}_${Date.now()}`,
    notes: { userId: String(req.user.id), purpose: cp.PURPOSE, enrollmentId: String(enrollment.id) },
  });
  await cp.rememberOrder(enrollment, order.id);
  res.json({ success: true, data: { orderId: order.id, keyId: rz.keyId, amount: order.amount } });
});

// POST /iplatform/cert-payment-verify  (checkout callback)
const verifyCertPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  const rz = cp.getRazorpay();
  if (!rz) { res.status(503); throw new Error('Payment service not configured'); }
  if (!cp.signatureValid(razorpay_order_id, razorpay_payment_id, razorpay_signature, rz.keySecret)) {
    res.status(400); throw new Error('Payment verification failed');
  }
  // The order must be this student's certificate order (stops reusing someone else's payment)
  if (!(await cp.orderBelongsTo(rz.client, razorpay_order_id, req.user.id))) {
    res.status(403); throw new Error('This payment does not belong to your account');
  }
  const enrollment = await cp.getCompletedEnrollment(req.user.id);
  if (!enrollment) { res.status(400); throw new Error('No completed internship found'); }
  await cp.markPaid(enrollment, { paymentId: razorpay_payment_id, orderId: razorpay_order_id, method: 'checkout' });
  res.json({ success: true, paid: true, message: 'Payment verified. Certificates unlocked!' });
});

// GET /iplatform/cert-payment-status
const checkCertPaymentStatus = asyncHandler(async (req, res) => {
  const enrollment = await cp.getCompletedEnrollment(req.user.id);
  if (!enrollment) return res.json({ success: true, paid: false, isLegacy: false });
  const isLegacy = isLegacyEnrollment(enrollment);
  res.json({ success: true, paid: cp.isPaid(enrollment) || isLegacy, isLegacy });
});

// POST /iplatform/cert-payment-sync  — "Already paid? Check payment status"
// Asks Razorpay whether this student's certificate order was paid, and unlocks if so.
const syncCertPayment = asyncHandler(async (req, res) => {
  const enrollment = await cp.getCompletedEnrollment(req.user.id);
  if (!enrollment) return res.json({ success: true, paid: false, message: 'No completed internship found' });
  if (cp.isPaid(enrollment) || isLegacyEnrollment(enrollment)) return res.json({ success: true, paid: true });

  const deepScan = req.body?.deep === true;
  const found = await cp.findPaymentForUser(req.user.id, enrollment, { deepScan });
  if (found.error) { res.status(503); throw new Error(found.error); }
  if (!found.payment) {
    return res.json({ success: true, paid: false, message: 'We could not find a completed payment yet. If money was debited, it can take a few minutes to confirm.' });
  }
  await cp.markPaid(enrollment, { paymentId: found.payment.id, orderId: found.orderId, method: found.via });
  res.json({ success: true, paid: true, message: 'Payment confirmed. Certificates unlocked!' });
});

// ── ADMIN ────────────────────────────────────────────────────────────
async function findStudentEnrollmentByEmail(email) {
  const { User } = require('../models');
  const user = await User.findOne({ where: { email: String(email || '').trim().toLowerCase() } });
  if (!user) return { error: 'No account found with that email' };
  const enrollment = await cp.getCompletedEnrollment(user.id);
  return { user, enrollment };
}

// GET /iplatform/admin/cert-payment?email=
const adminCertPaymentLookup = asyncHandler(async (req, res) => {
  const { user, enrollment, error } = await findStudentEnrollmentByEmail(req.query.email);
  if (error) { res.status(404); throw new Error(error); }
  if (!enrollment) {
    return res.json({ success: true, data: { name: user.name, email: user.email, completed: false } });
  }
  const meta = Array.isArray(enrollment.completedTasks) ? enrollment.completedTasks : [];
  res.json({ success: true, data: {
    name: user.name, email: user.email, completed: true,
    isLegacy: isLegacyEnrollment(enrollment),
    payment: cp.paymentRecord(enrollment),
    ordersCreated: meta.filter((m) => m && m._type === 'cert_order').length,
  } });
});

// POST /iplatform/admin/cert-unlock  { email, mode: 'razorpay' | 'utr' | 'manual', utr?, note? }
const adminCertUnlock = asyncHandler(async (req, res) => {
  const { email, mode = 'razorpay', utr, note } = req.body || {};
  const { user, enrollment, error } = await findStudentEnrollmentByEmail(email);
  if (error) { res.status(404); throw new Error(error); }
  if (!enrollment) { res.status(400); throw new Error('This student has not completed an internship yet'); }
  if (cp.isPaid(enrollment)) return res.json({ success: true, alreadyPaid: true, payment: cp.paymentRecord(enrollment) });

  if (mode === 'razorpay') {
    const found = await cp.findPaymentForUser(user.id, enrollment, { deepScan: true });
    if (found.error) { res.status(503); throw new Error(found.error); }
    if (!found.payment) { res.status(404); throw new Error('No paid certificate order found on Razorpay for this student. Try the UTR from their receipt.'); }
    const record = await cp.markPaid(enrollment, { paymentId: found.payment.id, orderId: found.orderId, method: 'admin_razorpay_check', byAdmin: req.user.id });
    return res.json({ success: true, payment: record, message: 'Payment found on Razorpay. Certificates unlocked.' });
  }

  if (mode === 'utr') {
    const found = await cp.findPaymentByUtr(utr);
    if (found.error) { res.status(400); throw new Error(found.error); }
    const p = found.payment;
    if (!p) { res.status(404); throw new Error('No Razorpay payment found with that UTR in the last 90 days'); }
    if (p.amount < cp.CERT_AMOUNT || !['captured', 'authorized'].includes(p.status)) {
      res.status(400); throw new Error(`Payment found but it is ₹${p.amount / 100} with status "${p.status}"`);
    }
    // Make sure the same payment isn't used to unlock two students
    const { InternshipEnrollment } = require('../models/internshipPlatform');
    const { sequelize } = require('../config/db');
    const reused = await InternshipEnrollment.findOne({
      where: sequelize.literal(`"completedTasks"::text LIKE ${sequelize.escape('%' + p.id + '%')}`),
    });
    if (reused && reused.id !== enrollment.id) { res.status(409); throw new Error('That payment has already been used to unlock another student'); }
    const record = await cp.markPaid(enrollment, { paymentId: p.id, orderId: p.order_id || null, utr: String(utr).replace(/\D/g, ''), method: 'admin_utr', byAdmin: req.user.id });
    return res.json({ success: true, payment: record, message: 'UTR verified on Razorpay. Certificates unlocked.' });
  }

  if (mode === 'manual') {
    if (!note || String(note).trim().length < 4) { res.status(400); throw new Error('Add a short note (e.g. "paid cash at office" or a reference)'); }
    const record = await cp.markPaid(enrollment, { method: 'admin_manual', note: String(note).slice(0, 300), byAdmin: req.user.id });
    return res.json({ success: true, payment: record, message: 'Certificates unlocked manually.' });
  }

  res.status(400); throw new Error('Unknown mode');
});

// ── RAZORPAY WEBHOOK (POST /api/payments/razorpay-webhook, raw body) ─
// Razorpay Dashboard → Settings → Webhooks: events "order.paid" and "payment.captured",
// secret = RAZORPAY_WEBHOOK_SECRET. Unlocks even if the student closed the page.
const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    if (!cp.webhookSignatureValid(raw, req.headers['x-razorpay-signature'], secret)) {
      return res.status(400).json({ ok: false });
    }
    const evt = JSON.parse(raw.toString('utf8'));
    const payment = evt?.payload?.payment?.entity;
    let order = evt?.payload?.order?.entity;
    if (!payment || !['order.paid', 'payment.captured'].includes(evt.event)) return res.json({ ok: true, ignored: true });

    if (!order && payment.order_id) {
      const rz = cp.getRazorpay();
      if (rz) order = await rz.client.orders.fetch(payment.order_id).catch(() => null);
    }
    if (!order || order.notes?.purpose !== cp.PURPOSE || !order.notes?.userId) return res.json({ ok: true, ignored: true });
    if (payment.amount < cp.CERT_AMOUNT) return res.json({ ok: true, ignored: true });

    const enrollment = await cp.getCompletedEnrollment(order.notes.userId);
    if (enrollment) await cp.markPaid(enrollment, { paymentId: payment.id, orderId: order.id, method: 'webhook' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[razorpay-webhook]', err.message);
    res.status(500).json({ ok: false }); // Razorpay will retry
  }
};

module.exports = {
  submitDailyLog,
  getMyDailyLogs,
  createCertPaymentOrder,
  verifyCertPayment,
  checkCertPaymentStatus,
  syncCertPayment,
  adminCertPaymentLookup,
  adminCertUnlock,
  razorpayWebhook,
};