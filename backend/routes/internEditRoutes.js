// routes/internEditRoutes.js
// Lets interns edit work they already submitted (tasks + daily logs), only while
// the admin has switched editing ON for everyone.
//
//   GET  /api/intern-edit/setting              -> { enabled }            (any logged-in user)
//   PUT  /api/intern-edit/setting              -> admin turns it on/off  { enabled: true|false }
//   GET  /api/intern-edit/my-submissions       -> the intern's tasks + daily logs
//   PUT  /api/intern-edit/tasks/:taskId        -> edit one submitted task
//   PUT  /api/intern-edit/daily-logs/:id       -> edit one daily log
//
// Admin import of daily logs an intern kept outside the portal (e.g. in an Excel sheet):
//   GET  /api/intern-edit/admin/enrollments?q=  -> find the intern
//   POST /api/intern-edit/admin/import-daily-logs { enrollmentId, sourceName, rows[] }
// Imported logs keep the dates from the sheet, but are permanently marked as imported
// (when, by whom, from which file), so nobody mistakes them for logs typed in on the day.
//
// Interns can only change the text of existing entries. They cannot add new entries
// or change dates. Every edit is stamped with editedAt so the record stays honest.

const express = require('express');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { protect, authorize } = require('../middleware/auth');

const r = express.Router();

// ── Storage: a tiny key/value settings table + "edited" columns on daily logs ──
let ready = null;
const ensureTables = () => {
  if (!ready) {
    ready = (async () => {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key         TEXT PRIMARY KEY,
          value       JSONB NOT NULL DEFAULT 'null'::jsonb,
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
      await sequelize.query(`ALTER TABLE IF EXISTS ip_daily_logs ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMPTZ`);
      await sequelize.query(`ALTER TABLE IF EXISTS ip_daily_logs ADD COLUMN IF NOT EXISTS "editCount" INTEGER NOT NULL DEFAULT 0`);
      await sequelize.query(`ALTER TABLE IF EXISTS ip_daily_logs ADD COLUMN IF NOT EXISTS "importedAt" TIMESTAMPTZ`);
      await sequelize.query(`ALTER TABLE IF EXISTS ip_daily_logs ADD COLUMN IF NOT EXISTS "importedBy" TEXT`);
      await sequelize.query(`ALTER TABLE IF EXISTS ip_daily_logs ADD COLUMN IF NOT EXISTS "importSource" TEXT`);
    })().catch(err => { ready = null; throw err; });
  }
  return ready;
};

const SETTING_KEY = 'intern_edit_submissions';

const isEditingOn = async () => {
  await ensureTables();
  const [rows] = await sequelize.query(`SELECT value FROM app_settings WHERE key = :key`, { replacements: { key: SETTING_KEY } });
  return rows[0]?.value === true;
};

// Short, clean text; undefined means "not sent, keep as is"
const clean = (v, max) => {
  if (v === undefined) return undefined;
  if (v === null) return '';
  return String(v).trim().slice(0, max);
};

const getEnrollment = async (userId) => {
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  return InternshipEnrollment.findOne({
    where: { userId, status: { [Op.in]: ['Active', 'Completed'] } },
    order: [['createdAt', 'DESC']],
  });
};

const requireEditingOn = asyncHandler(async (req, res, next) => {
  if (!(await isEditingOn())) {
    res.status(403);
    throw new Error('Editing submitted work is turned off right now');
  }
  next();
});

// ── Setting ───────────────────────────────────────────────────────
r.get('/setting', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { enabled: await isEditingOn() } });
}));

r.put('/setting', protect, authorize('admin'), asyncHandler(async (req, res) => {
  if (req.user?.role !== 'admin') { res.status(403); throw new Error('Only the main admin can change this'); }
  await ensureTables();
  const enabled = req.body?.enabled === true;
  await sequelize.query(
    `INSERT INTO app_settings (key, value, "updatedAt") VALUES (:key, CAST(:value AS jsonb), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    { replacements: { key: SETTING_KEY, value: JSON.stringify(enabled) } },
  );
  console.log(`[intern-edit] ${req.user.email} turned editing ${enabled ? 'ON' : 'OFF'}`);
  res.json({ success: true, data: { enabled }, message: enabled ? 'Interns can now edit their submissions' : 'Editing turned off' });
}));

// ── The intern's own submissions ──────────────────────────────────
r.get('/my-submissions', protect, authorize('student'), asyncHandler(async (req, res) => {
  const enabled = await isEditingOn();
  const enrollment = await getEnrollment(req.user.id);
  if (!enrollment) return res.json({ success: true, data: { enabled, tasks: [], dailyLogs: [] } });

  const [dailyLogs] = await sequelize.query(
    `SELECT id, "logDate", "todaysWork", "hoursWorked", learning, challenges, "tomorrowPlan", "editedAt", "editCount",
            "importedAt", "importSource"
       FROM ip_daily_logs WHERE "enrollmentId" = :eid AND "userId" = :uid ORDER BY "logDate" DESC`,
    { replacements: { eid: enrollment.id, uid: req.user.id } },
  ).catch(() => [[]]);

  res.json({ success: true, data: { enabled, tasks: enrollment.taskLogs || [], dailyLogs } });
}));

// ── Edit a submitted task (stored in the enrollment's taskLogs list) ──
r.put('/tasks/:taskId', protect, authorize('student'), requireEditingOn, asyncHandler(async (req, res) => {
  const enrollment = await getEnrollment(req.user.id);
  if (!enrollment) { res.status(404); throw new Error('No internship enrollment found'); }

  const logs = Array.isArray(enrollment.taskLogs) ? [...enrollment.taskLogs] : [];
  const i = logs.findIndex(t => String(t.id) === String(req.params.taskId));
  if (i < 0) { res.status(404); throw new Error('Task not found'); }

  const title = clean(req.body.title, 200);
  const description = clean(req.body.description, 5000);
  const url = clean(req.body.url, 500);
  if (title !== undefined && !title) { res.status(400); throw new Error('Task title cannot be empty'); }
  if (url && !/^https?:\/\//i.test(url)) { res.status(400); throw new Error('Link must start with http:// or https://'); }

  const before = logs[i];
  logs[i] = {
    ...before,
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(url !== undefined && { url }),
    // submittedAt, week and status stay exactly as they were
    editedAt: new Date(),
    editCount: (before.editCount || 0) + 1,
  };

  enrollment.set('taskLogs', logs);
  enrollment.changed('taskLogs', true); // JSONB arrays need an explicit nudge to save
  await enrollment.save();
  res.json({ success: true, data: logs[i], message: 'Task updated' });
}));

// ── Edit a daily log ──────────────────────────────────────────────
r.put('/daily-logs/:id', protect, authorize('student'), requireEditingOn, asyncHandler(async (req, res) => {
  const enrollment = await getEnrollment(req.user.id);
  if (!enrollment) { res.status(404); throw new Error('No internship enrollment found'); }

  const [rows] = await sequelize.query(
    `SELECT * FROM ip_daily_logs WHERE id = :id AND "enrollmentId" = :eid AND "userId" = :uid`,
    { replacements: { id: req.params.id, eid: enrollment.id, uid: req.user.id } },
  );
  const log = rows[0];
  if (!log) { res.status(404); throw new Error('Daily log not found'); }

  const pick = (key, max) => (clean(req.body[key], max) !== undefined ? clean(req.body[key], max) : log[key]);
  let hours = req.body.hoursWorked !== undefined ? Number(req.body.hoursWorked) : Number(log.hoursWorked || 0);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) { res.status(400); throw new Error('Hours must be between 0 and 24'); }
  hours = Math.round(hours * 10) / 10;

  const todaysWork = pick('todaysWork', 5000);
  if (!todaysWork) { res.status(400); throw new Error("Today's work cannot be empty"); }

  const [updated] = await sequelize.query(
    `UPDATE ip_daily_logs
        SET "todaysWork" = :todaysWork, "hoursWorked" = :hours, learning = :learning,
            challenges = :challenges, "tomorrowPlan" = :tomorrowPlan,
            "editedAt" = NOW(), "editCount" = COALESCE("editCount", 0) + 1, "updatedAt" = NOW()
      WHERE id = :id
      RETURNING id, "logDate", "todaysWork", "hoursWorked", learning, challenges, "tomorrowPlan", "editedAt", "editCount",
                "importedAt", "importSource"`,
    {
      replacements: {
        id: log.id, todaysWork, hours,
        learning: pick('learning', 5000), challenges: pick('challenges', 5000), tomorrowPlan: pick('tomorrowPlan', 5000),
      },
    },
  );
  res.json({ success: true, data: updated[0], message: 'Daily log updated' });
}));

// ── Admin: import daily logs kept outside the portal ───────────────
const mainAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Only the main admin can import logs' });
  next();
};

const ymd = (d) => {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(String(d).slice(0, 10) + 'T00:00:00Z');
  return isNaN(x.getTime()) ? null : x.toISOString().slice(0, 10);
};

// The internship period: offer letter dates first, then the enrollment's own dates
const periodOf = async (enrollment) => {
  const { InternshipApplication } = require('../models/internshipPlatform');
  const app = enrollment.applicationId ? await InternshipApplication.findByPk(enrollment.applicationId).catch(() => null) : null;
  const start = ymd(app?.offerJoiningDate) || ymd(enrollment.startDate) || ymd(enrollment.createdAt);
  let end = ymd(app?.offerEndDate) || ymd(enrollment.completedAt);
  const today = new Date().toISOString().slice(0, 10);
  if (!end || end > today) end = today; // never in the future
  return { start, end };
};

r.get('/admin/enrollments', protect, authorize('admin'), mainAdminOnly, asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, data: [] });
  const [rows] = await sequelize.query(
    `SELECT e.id, e."studentName", e.email, e.status, e."startDate", e."completedAt", d.name AS domain,
            (SELECT COUNT(*) FROM ip_daily_logs l WHERE l."enrollmentId" = e.id)::int AS "logCount"
       FROM ip_enrollments e LEFT JOIN ip_domains d ON d.id = e."domainId"
      WHERE e."studentName" ILIKE :q OR e.email ILIKE :q
      ORDER BY e."createdAt" DESC LIMIT 15`,
    { replacements: { q: `%${q}%` } },
  );
  for (const row of rows) {
    const enr = await (require('../models/internshipPlatform').InternshipEnrollment).findByPk(row.id);
    row.period = enr ? await periodOf(enr) : null;
  }
  res.json({ success: true, data: rows });
}));

r.post('/admin/import-daily-logs', protect, authorize('admin'), mainAdminOnly, asyncHandler(async (req, res) => {
  await ensureTables();
  const { InternshipEnrollment } = require('../models/internshipPlatform');
  const enrollment = await InternshipEnrollment.findByPk(req.body?.enrollmentId);
  if (!enrollment) { res.status(404); throw new Error('Enrollment not found'); }

  const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 400) : [];
  if (!rows.length) { res.status(400); throw new Error('No rows to import'); }
  const sourceName = clean(req.body?.sourceName, 200) || 'Excel sheet';
  const { start, end } = await periodOf(enrollment);

  const [existing] = await sequelize.query(
    `SELECT "logDate" FROM ip_daily_logs WHERE "enrollmentId" = :eid`, { replacements: { eid: enrollment.id } },
  );
  const taken = new Set(existing.map(e => ymd(e.logDate)));

  const results = { imported: 0, skipped: [] };
  const toInsert = [];
  rows.forEach((row, i) => {
    const line = i + 1;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(row?.logDate || '')) ? String(row.logDate) : null;
    const work = clean(row?.todaysWork, 5000);
    let hours = Number(row?.hoursWorked ?? 0);
    if (!Number.isFinite(hours) || hours < 0) hours = 0;
    hours = Math.min(24, Math.round(hours * 10) / 10);
    if (!date) return results.skipped.push({ line, reason: 'Date missing or not readable' });
    if (start && date < start) return results.skipped.push({ line, date, reason: `Before the internship started (${start})` });
    if (end && date > end) return results.skipped.push({ line, date, reason: `After ${end} (internship end or today)` });
    if (!work) return results.skipped.push({ line, date, reason: "Today's work is empty" });
    if (taken.has(date)) return results.skipped.push({ line, date, reason: 'A log for this date already exists' });
    taken.add(date);
    toInsert.push({ date, work, hours, learning: clean(row?.learning, 5000) || null, challenges: clean(row?.challenges, 5000) || null, tomorrowPlan: clean(row?.tomorrowPlan, 5000) || null });
  });

  if (toInsert.length) {
    await sequelize.transaction(async (t) => {
      for (const x of toInsert) {
        await sequelize.query(
          `INSERT INTO ip_daily_logs ("enrollmentId", "userId", "logDate", "todaysWork", "hoursWorked", learning, challenges, "tomorrowPlan",
                                      "importedAt", "importedBy", "importSource", "createdAt", "updatedAt")
           VALUES (:eid, :uid, :date, :work, :hours, :learning, :challenges, :tomorrowPlan, NOW(), :by, :src, NOW(), NOW())`,
          { replacements: { eid: enrollment.id, uid: enrollment.userId, ...x, by: req.user.email || String(req.user.id), src: sourceName }, transaction: t },
        );
      }
    });
    results.imported = toInsert.length;
  }
  console.log(`[intern-edit] ${req.user.email} imported ${results.imported} daily logs for enrollment ${enrollment.id} from "${sourceName}"`);
  res.json({ success: true, data: results, message: `${results.imported} logs imported, ${results.skipped.length} skipped` });
}));

module.exports = r;