// backend/routes/logicBuilderRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

// ── STUDENT: Get my progress ──────────────────────────────────────
router.get('/progress', protect, authorize('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await sequelize.query(
      `SELECT * FROM logic_builder_progress WHERE user_id = :userId LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) {
    console.error('logic-builder get progress:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── STUDENT: Save/update progress ────────────────────────────────
router.post('/progress', protect, authorize('student'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { language, current_day, streak, total_score, completed_steps } = req.body;

    const existing = await sequelize.query(
      `SELECT id FROM logic_builder_progress WHERE user_id = :userId LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    if (existing.length > 0) {
      await sequelize.query(
        `UPDATE logic_builder_progress
         SET language = COALESCE(:language, language),
             current_day = COALESCE(:current_day, current_day),
             streak = COALESCE(:streak, streak),
             total_score = COALESCE(:total_score, total_score),
             completed_steps = COALESCE(:completed_steps::jsonb, completed_steps),
             last_active = NOW(),
             updated_at = NOW()
         WHERE user_id = :userId`,
        {
          replacements: {
            userId,
            language: language || null,
            current_day: current_day || null,
            streak: streak !== undefined ? streak : null,
            total_score: total_score !== undefined ? total_score : null,
            completed_steps: completed_steps ? JSON.stringify(completed_steps) : null,
          },
          type: QueryTypes.UPDATE,
        }
      );
    } else {
      await sequelize.query(
        `INSERT INTO logic_builder_progress
           (user_id, language, current_day, streak, total_score, completed_steps, last_active, created_at, updated_at)
         VALUES
           (:userId, :language, :current_day, :streak, :total_score, :completed_steps::jsonb, NOW(), NOW(), NOW())`,
        {
          replacements: {
            userId,
            language: language || 'Python',
            current_day: current_day || 1,
            streak: streak || 0,
            total_score: total_score || 0,
            completed_steps: JSON.stringify(completed_steps || []),
          },
          type: QueryTypes.INSERT,
        }
      );
    }

    const updated = await sequelize.query(
      `SELECT * FROM logic_builder_progress WHERE user_id = :userId LIMIT 1`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );
    res.json({ success: true, data: updated[0] });
  } catch (err) {
    console.error('logic-builder save progress:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Stats ──────────────────────────────────────────────────
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
  try {
    // Total active (active in last 7 days)
    const [totalRow] = await sequelize.query(
      `SELECT COUNT(*) as total FROM logic_builder_progress`,
      { type: QueryTypes.SELECT }
    );
    const [activeRow] = await sequelize.query(
      `SELECT COUNT(*) as active FROM logic_builder_progress WHERE last_active >= NOW() - INTERVAL '7 days'`,
      { type: QueryTypes.SELECT }
    );

    // Language distribution
    const langStats = await sequelize.query(
      `SELECT language, COUNT(*) as count FROM logic_builder_progress GROUP BY language ORDER BY count DESC`,
      { type: QueryTypes.SELECT }
    );

    // Daily completion rate last 14 days
    const dailyRate = await sequelize.query(
      `SELECT DATE(last_active) as date, COUNT(*) as completions
       FROM logic_builder_progress
       WHERE last_active >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(last_active)
       ORDER BY date ASC`,
      { type: QueryTypes.SELECT }
    );

    // Top 10 scorers
    const topScorers = await sequelize.query(
      `SELECT lp.*, u.name, u.email
       FROM logic_builder_progress lp
       JOIN users u ON u.id = lp.user_id
       ORDER BY lp.total_score DESC, lp.streak DESC
       LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    // At-risk: inactive 3+ days
    const atRisk = await sequelize.query(
      `SELECT lp.*, u.name, u.email
       FROM logic_builder_progress lp
       JOIN users u ON u.id = lp.user_id
       WHERE lp.last_active < NOW() - INTERVAL '3 days'
         AND lp.streak > 0
       ORDER BY lp.last_active ASC
       LIMIT 20`,
      { type: QueryTypes.SELECT }
    );

    // All students summary
    const allStudents = await sequelize.query(
      `SELECT lp.user_id, u.name, u.email, lp.language, lp.streak, lp.total_score,
              lp.current_day, lp.last_active
       FROM logic_builder_progress lp
       JOIN users u ON u.id = lp.user_id
       ORDER BY lp.last_active DESC`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        total: parseInt(totalRow.total),
        active: parseInt(activeRow.active),
        langStats,
        dailyRate,
        topScorers,
        atRisk,
        allStudents,
      },
    });
  } catch (err) {
    console.error('logic-builder admin stats:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
