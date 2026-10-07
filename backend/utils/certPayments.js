/**
 * utils/certPayments.js
 * Internship certificate payments (₹100) via Razorpay.
 *
 * The old flow unlocked certificates ONLY from the browser callback after checkout.
 * On phones the UPI app switch can lose that page, so students paid but stayed locked.
 * These helpers let the server confirm payments with Razorpay directly:
 *   - remembered orders  : every order we create is saved on the enrollment
 *   - deep scan          : finds this student's orders on Razorpay (orders.notes.userId)
 *   - UTR lookup         : finds a UPI payment by the UTR/RRN printed on the receipt
 * Payment status lives in enrollment.completedTasks as { _type: 'cert_payment', ... } (unchanged format).
 */
const crypto = require('crypto');

const CERT_AMOUNT = 10000; // ₹100 in paise
const PURPOSE = 'internship_certificate';
const MAX_REMEMBERED_ORDERS = 10;

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  const Razorpay = require('razorpay');
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
}

function getModel() {
  return require('../models/internshipPlatform').InternshipEnrollment;
}

async function getCompletedEnrollment(userId) {
  return getModel().findOne({ where: { userId, status: 'Completed' }, order: [['updatedAt', 'DESC']] });
}

const metaOf = (enrollment) => (Array.isArray(enrollment.completedTasks) ? enrollment.completedTasks : []);
const paymentRecord = (enrollment) => metaOf(enrollment).find((m) => m && m._type === 'cert_payment') || null;
const isPaid = (enrollment) => !!paymentRecord(enrollment);

async function rememberOrder(enrollment, orderId) {
  const meta = metaOf(enrollment);
  const orders = meta.filter((m) => m && m._type === 'cert_order');
  const others = meta.filter((m) => !(m && m._type === 'cert_order'));
  const kept = [...orders, { _type: 'cert_order', orderId, createdAt: new Date().toISOString() }].slice(-MAX_REMEMBERED_ORDERS);
  await enrollment.update({ completedTasks: [...others, ...kept] });
}

async function markPaid(enrollment, details) {
  await enrollment.reload();
  if (isPaid(enrollment)) return paymentRecord(enrollment);
  const record = { _type: 'cert_payment', paidAt: new Date().toISOString(), ...details };
  await enrollment.update({ completedTasks: [...metaOf(enrollment), record] });
  return record;
}

/** Timing-safe check of Razorpay's checkout signature */
function signatureValid(orderId, paymentId, signature, keySecret) {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Captured (or capturable) ₹100 payment for an order, else null */
async function paidPaymentForOrder(rzp, orderId) {
  const res = await rzp.orders.fetchPayments(orderId);
  const items = res?.items || [];
  const captured = items.find((p) => p.status === 'captured' && p.amount >= CERT_AMOUNT);
  if (captured) return captured;
  const authorized = items.find((p) => p.status === 'authorized' && p.amount >= CERT_AMOUNT);
  if (authorized) {
    // Accounts with manual capture: capture it so the money isn't auto-refunded
    try { return await rzp.payments.capture(authorized.id, authorized.amount, authorized.currency || 'INR'); }
    catch { return authorized; }
  }
  return null;
}

/** Does this order belong to this user and this purpose? */
async function orderBelongsTo(rzp, orderId, userId) {
  const order = await rzp.orders.fetch(orderId);
  return order && String(order.notes?.userId) === String(userId) && order.notes?.purpose === PURPOSE && order.amount >= CERT_AMOUNT;
}

/**
 * Look for a successful payment by this student on Razorpay.
 * 1) orders we remembered on the enrollment (fast)
 * 2) deepScan: page through Razorpay orders created since the enrollment, matching notes.userId
 */
async function findPaymentForUser(userId, enrollment, { deepScan = false } = {}) {
  const rz = getRazorpay();
  if (!rz) return { error: 'Payment service not configured' };
  const rzp = rz.client;

  const remembered = metaOf(enrollment).filter((m) => m && m._type === 'cert_order').map((m) => m.orderId).reverse();
  for (const orderId of remembered) {
    try {
      const pay = await paidPaymentForOrder(rzp, orderId);
      if (pay) return { payment: pay, orderId, via: 'remembered_order' };
    } catch (e) { /* keep checking others */ }
  }
  if (!deepScan) return { payment: null };

  const since = Math.floor(new Date(enrollment.createdAt).getTime() / 1000) - 86400;
  const now = Math.floor(Date.now() / 1000) + 3600;
  for (let skip = 0; skip < 1000; skip += 100) {
    const page = await rzp.orders.all({ from: since, to: now, count: 100, skip });
    const items = page?.items || [];
    for (const o of items) {
      if (String(o.notes?.userId) !== String(userId) || o.notes?.purpose !== PURPOSE) continue;
      if (o.amount_paid >= CERT_AMOUNT || o.status === 'paid' || o.status === 'attempted') {
        const pay = await paidPaymentForOrder(rzp, o.id).catch(() => null);
        if (pay) return { payment: pay, orderId: o.id, via: 'order_scan' };
      }
    }
    if (items.length < 100) break;
  }
  return { payment: null };
}

/** Find a captured ₹100 UPI payment by its UTR / RRN (from the student's receipt) */
async function findPaymentByUtr(utr, { days = 90 } = {}) {
  const rz = getRazorpay();
  if (!rz) return { error: 'Payment service not configured' };
  const clean = String(utr || '').replace(/\D/g, '');
  if (clean.length < 9) return { error: 'Enter the 12-digit UTR from the receipt' };
  const from = Math.floor(Date.now() / 1000) - days * 86400;
  for (let skip = 0; skip < 2000; skip += 100) {
    const page = await rz.client.payments.all({ from, count: 100, skip });
    const items = page?.items || [];
    const hit = items.find((p) => {
      const ad = p.acquirer_data || {};
      return [ad.rrn, ad.upi_transaction_id, ad.bank_transaction_id].some((v) => v && String(v).replace(/\D/g, '') === clean);
    });
    if (hit) return { payment: hit };
    if (items.length < 100) break;
  }
  return { payment: null };
}

/** Webhook signature: HMAC-SHA256 of the raw body with the webhook secret */
function webhookSignatureValid(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  CERT_AMOUNT, PURPOSE, getRazorpay, getCompletedEnrollment, isPaid, paymentRecord, rememberOrder, markPaid,
  signatureValid, orderBelongsTo, findPaymentForUser, findPaymentByUtr, webhookSignatureValid, paidPaymentForOrder,
};
