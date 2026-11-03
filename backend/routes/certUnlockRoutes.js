// routes/certUnlockRoutes.js
// Certificate unlock: the fee switch and the LinkedIn share requirement.
//
//   GET  /api/cert-unlock/settings                -> current rules (any logged-in user)
//   PUT  /api/cert-unlock/settings                -> admin: { feeSwitch?, feeAutoOn?, linkedinRequired? }
//   GET  /api/cert-unlock/my                      -> intern: their unlock state + submitted proof
//   POST /api/cert-unlock/linkedin                -> intern: { postUrl, screenshot (data URL) }
//   GET  /api/cert-unlock/admin/linkedin?q=       -> admin: submitted proofs, newest first
//   GET  /api/cert-unlock/admin/linkedin/:userId/screenshot
//   PUT  /api/cert-unlock/admin/linkedin/:userId  -> admin: { status: 'rejected'|'submitted', note }
//
// Mounted in server.js before express.json() with its own 4 MB body limit (screenshots).

const express = require('express');
const asyncHandler = require('express-async-handler');
const { sequelize } = require('../config/db');
const { protect, authorize } = require('../middleware/auth');
const gate = require('../utils/certGate');

const r = express.Router();
r.use(express.json({ limit: '4mb' }));

const mainAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Only the main admin can do this' });
  next();
};

// A LinkedIn post link: linkedin.com/posts/..., /feed/update/urn:li:..., or lnkd.in short links
const LINKEDIN_POST = /^https:\/\/((www|[a-z]{2})\.)?linkedin\.com\/(posts\/[^\s]+|feed\/update\/urn:li:(activity|share|ugcPost):\d+[^\s]*|pulse\/[^\s]+)$|^https:\/\/lnkd\.in\/[A-Za-z0-9_-]+$/i;

// ── Settings ─────────────────────────────────────────────────────
r.get('/settings', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: await gate.getSettings() });
}));

r.put('/settings', protect, authorize('admin'), mainAdminOnly, asyncHandler(async (req, res) => {
  const changes = {};
  if (typeof req.body?.feeSwitch === 'boolean') changes.feeSwitch = req.body.feeSwitch;
  if (typeof req.body?.linkedinRequired === 'boolean') changes.linkedinRequired = req.body.linkedinRequired;
  if (req.body?.feeAutoOn !== undefined) {
    const v = String(req.body.feeAutoOn || '').trim();
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) { res.status(400); throw new Error('Date must look like 2028-02-02'); }
    changes.feeAutoOn = v;
  }
  const data = await gate.saveSettings(changes);
  console.log(`[cert-unlock] ${req.user.email} changed settings ${JSON.stringify(changes)}`);
  res.json({ success: true, data });
}));

// ── Intern ───────────────────────────────────────────────────────
const latestEnrollment = async (userId) => {
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  return InternshipEnrollment.findOne({ where: { userId }, order: [['createdAt', 'DESC']] });
};

r.get('/my', protect, authorize('student'), asyncHandler(async (req, res) => {
  const cp = require('../utils/certPayments');
  const enrollment = await latestEnrollment(req.user.id);
  // Same rule as internshipDailyLog.js: interns enrolled before 6 Aug 2026 never pay
  const paidOrLegacy = enrollment ? (cp.isPaid(enrollment) || new Date(enrollment.createdAt) < new Date('2026-08-06T18:29:59.000Z')) : false;
  const state = await gate.unlockState(req.user.id, paidOrLegacy);
  const proof = await gate.getLinkedinProof(req.user.id);
  res.json({ success: true, data: { ...state, proof } });
}));

r.post('/linkedin', protect, authorize('student'), asyncHandler(async (req, res) => {
  await gate.ensureTables();
  // A link copied while logged out is a login link with the real post inside (session_redirect=...)
  let postUrl = String(req.body?.postUrl || '').trim();
  for (let i = 0; i < 3; i++) {
    try {
      const u = new URL(postUrl);
      const inner = u.searchParams.get('session_redirect') || u.searchParams.get('redirect') || u.searchParams.get('url');
      if (inner && /linkedin\.com|lnkd\.in/i.test(inner)) { postUrl = decodeURIComponent(inner); continue; }
    } catch { /* not a URL */ }
    break;
  }
  postUrl = postUrl.replace(/[?#].*$/, '').slice(0, 600); // drop tracking bits
  const screenshot = String(req.body?.screenshot || '');
  if (!LINKEDIN_POST.test(postUrl)) {
    res.status(400);
    throw new Error('Paste the link of your LinkedIn post (it starts with https://www.linkedin.com/posts/ or https://www.linkedin.com/feed/update/)');
  }
  if (!/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(screenshot)) {
    res.status(400); throw new Error('Add a screenshot of the Experience section on your LinkedIn profile');
  }
  if (screenshot.length > 3_000_000) { res.status(400); throw new Error('Screenshot is too large. Use a smaller image.'); }

  // The same post can't unlock two accounts
  const [dupe] = await sequelize.query(
    `SELECT "userId" FROM cert_linkedin_proofs WHERE lower("postUrl") = lower(:url) AND "userId" <> :uid`,
    { replacements: { url: postUrl, uid: req.user.id } },
  );
  if (dupe.length) { res.status(409); throw new Error('This post link is already used by another account'); }

  const enrollment = await latestEnrollment(req.user.id);
  await sequelize.query(
    `INSERT INTO cert_linkedin_proofs ("userId", "enrollmentId", "postUrl", screenshot, status, note, "submittedAt", "reviewedAt", "reviewedBy")
     VALUES (:uid, :eid, :url, :shot, 'submitted', NULL, NOW(), NULL, NULL)
     ON CONFLICT ("userId") DO UPDATE SET "enrollmentId" = EXCLUDED."enrollmentId", "postUrl" = EXCLUDED."postUrl",
       screenshot = EXCLUDED.screenshot, status = 'submitted', note = NULL, "submittedAt" = NOW(), "reviewedAt" = NULL, "reviewedBy" = NULL`,
    { replacements: { uid: req.user.id, eid: enrollment?.id || null, url: postUrl, shot: screenshot } },
  );
  res.json({ success: true, message: 'Thanks for sharing! Your LinkedIn step is done.' });
}));

// ── Admin review ─────────────────────────────────────────────────
r.get('/admin/linkedin', protect, authorize('admin'), mainAdminOnly, asyncHandler(async (req, res) => {
  await gate.ensureTables();
  const q = String(req.query.q || '').trim();
  const status = ['submitted', 'rejected'].includes(String(req.query.status)) ? String(req.query.status) : '';
  const [rows] = await sequelize.query(
    `SELECT p."userId", p."postUrl", p.status, p.note, p."submittedAt", p."reviewedAt", p."reviewedBy",
            u.name, u.email
       FROM cert_linkedin_proofs p LEFT JOIN users u ON u.id = p."userId"
      WHERE (:q = '' OR u.name ILIKE :like OR u.email ILIKE :like)
        AND (:status = '' OR p.status = :status)
      ORDER BY p."submittedAt" DESC
      LIMIT 300`,
    { replacements: { q, like: `%${q}%`, status } },
  );
  const [[counts]] = await sequelize.query(
    `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected FROM cert_linkedin_proofs`,
  );
  res.json({ success: true, data: rows, counts });
}));

r.get('/admin/linkedin/:userId/screenshot', protect, authorize('admin'), mainAdminOnly, asyncHandler(async (req, res) => {
  await gate.ensureTables();
  const [rows] = await sequelize.query(`SELECT screenshot FROM cert_linkedin_proofs WHERE "userId" = :uid`, { replacements: { uid: req.params.userId } });
  if (!rows[0]?.screenshot) { res.status(404); throw new Error('No screenshot'); }
  res.json({ success: true, data: rows[0].screenshot });
}));

r.put('/admin/linkedin/:userId', protect, authorize('admin'), mainAdminOnly, asyncHandler(async (req, res) => {
  await gate.ensureTables();
  const status = req.body?.status === 'rejected' ? 'rejected' : 'submitted';
  const note = String(req.body?.note || '').trim().slice(0, 300) || null;
  if (status === 'rejected' && !note) { res.status(400); throw new Error('Write a short reason so the intern knows what to fix'); }
  const [, meta] = await sequelize.query(
    `UPDATE cert_linkedin_proofs SET status = :status, note = :note, "reviewedAt" = NOW(), "reviewedBy" = :by WHERE "userId" = :uid`,
    { replacements: { status, note, by: req.user.email || String(req.user.id), uid: req.params.userId } },
  );
  if (!(meta?.rowCount)) { res.status(404); throw new Error('Not found'); }
  console.log(`[cert-unlock] ${req.user.email} marked LinkedIn proof of user ${req.params.userId} as ${status}`);
  res.json({ success: true, message: status === 'rejected' ? 'Marked as not valid. Certificates are locked again for this intern.' : 'Marked as fine' });
}));

module.exports = r;