/**
 * controllers/studentAcademyController.js
 * Hiresnix AI Academy for regular (main-portal) students.
 * Institution students keep using inst_academy_progress; regular students
 * get their own table so the two id spaces never mix.
 */
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { sequelize } = require('../config/db');
const { ACADEMY_COURSES, isCourseComplete } = require('../utils/academyCourses');
const { streamAcademyCertificate } = require('../utils/academyCertificate');

// ── Table (created automatically on first use) ─────────────────────
let tableReady = null;
function ensureTable() {
  if (!tableReady) {
    tableReady = sequelize.query(`
      CREATE TABLE IF NOT EXISTS student_academy_progress (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id    VARCHAR(50) NOT NULL,
        completed    JSONB NOT NULL DEFAULT '[]'::jsonb,
        xp           INTEGER NOT NULL DEFAULT 0,
        claimed_cert BOOLEAN NOT NULL DEFAULT false,
        cert_no      VARCHAR(40) UNIQUE,
        last_active  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, course_id)
      )
    `).catch((err) => { tableReady = null; throw err; });
  }
  return tableReady;
}

const newCertNo = () => `HXAC-S${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const studentIdLabel = (userId) => `Hiresnix Student ID: HXS-${String(userId).padStart(6, '0')}`;

// GET /api/student-academy/progress
const getProgress = asyncHandler(async (req, res) => {
  await ensureTable();
  const rows = await sequelize.query(
    'SELECT course_id, completed, xp, claimed_cert, cert_no, last_active FROM student_academy_progress WHERE user_id = :uid',
    { replacements: { uid: req.user.id }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ success: true, data: rows || [] });
});

// POST /api/student-academy/progress
const saveProgress = asyncHandler(async (req, res) => {
  await ensureTable();
  const { courseId, completed, xp } = req.body || {};
  if (!courseId || !ACADEMY_COURSES[courseId]) { res.status(400); throw new Error('Unknown course'); }

  const cleanCompleted = Array.isArray(completed)
    ? [...new Set(completed.filter(k => typeof k === 'string' && /^\d{1,2}-\d{1,3}$/.test(k)))].slice(0, 500)
    : [];
  const cleanXp = Math.max(0, Math.min(parseInt(xp) || 0, 100000));

  await sequelize.query(`
    INSERT INTO student_academy_progress (user_id, course_id, completed, xp, last_active)
    VALUES (:uid, :courseId, CAST(:completed AS jsonb), :xp, NOW())
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      completed   = CAST(:completed AS jsonb),
      xp          = GREATEST(student_academy_progress.xp, :xp),
      last_active = NOW()
  `, { replacements: { uid: req.user.id, courseId, completed: JSON.stringify(cleanCompleted), xp: cleanXp } });

  res.json({ success: true, message: 'Progress saved' });
});

// GET /api/student-academy/certificate/:courseId
const downloadCertificate = asyncHandler(async (req, res) => {
  await ensureTable();
  const { courseId } = req.params;
  const course = ACADEMY_COURSES[courseId];
  if (!course) { res.status(404); throw new Error('Unknown course'); }

  const rows = await sequelize.query(
    'SELECT completed, cert_no FROM student_academy_progress WHERE user_id = :uid AND course_id = :courseId LIMIT 1',
    { replacements: { uid: req.user.id, courseId }, type: sequelize.QueryTypes.SELECT }
  );
  const row = rows[0];
  if (!row || !isCourseComplete(courseId, row.completed)) {
    res.status(403); throw new Error('Finish all lessons in this course to get the certificate');
  }

  let certNo = row.cert_no;
  if (!certNo) {
    certNo = newCertNo();
    await sequelize.query(
      `UPDATE student_academy_progress SET cert_no = :certNo, claimed_cert = true
       WHERE user_id = :uid AND course_id = :courseId AND cert_no IS NULL`,
      { replacements: { certNo, uid: req.user.id, courseId } }
    );
    // Re-read in case two downloads raced
    const again = await sequelize.query(
      'SELECT cert_no FROM student_academy_progress WHERE user_id = :uid AND course_id = :courseId',
      { replacements: { uid: req.user.id, courseId }, type: sequelize.QueryTypes.SELECT }
    );
    certNo = again[0]?.cert_no || certNo;
  }

  try {
    await streamAcademyCertificate(res, {
      studentName: req.user.name || 'Student',
      idLabel: studentIdLabel(req.user.id),
      courseName: course.title,
      certNo,
      fileId: `HXS-${req.user.id}`,
    });
  } catch (err) {
    console.error('Student academy cert error:', err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Certificate generation failed' });
  }
});

// Used by the public verify endpoint
async function findStudentAcademyCert(certNo) {
  try {
    await ensureTable();
    const rows = await sequelize.query(
      `SELECT sap.course_id, sap.xp, sap.last_active, u.name, u.id AS user_id
       FROM student_academy_progress sap
       JOIN users u ON u.id = sap.user_id
       WHERE sap.cert_no = :certNo LIMIT 1`,
      { replacements: { certNo }, type: sequelize.QueryTypes.SELECT }
    );
    return rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = { getProgress, saveProgress, downloadCertificate, findStudentAcademyCert, studentIdLabel };
