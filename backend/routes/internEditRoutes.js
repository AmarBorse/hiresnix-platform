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
    `SELECT id, "logDate", "todaysWork", "hoursWorked", learning, challenges, "tomorrowPlan", "editedAt", "editCount"
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
      RETURNING id, "logDate", "todaysWork", "hoursWorked", learning, challenges, "tomorrowPlan", "editedAt", "editCount"`,
    {
      replacements: {
        id: log.id, todaysWork, hours,
        learning: pick('learning', 5000), challenges: pick('challenges', 5000), tomorrowPlan: pick('tomorrowPlan', 5000),
      },
    },
  );
  res.json({ success: true, data: updated[0], message: 'Daily log updated' });
}));

module.exports = r;
