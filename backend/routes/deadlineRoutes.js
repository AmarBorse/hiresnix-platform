/**
 * routes/deadlineRoutes.js
 * Public routes — no auth required
 */
const express = require('express');
const r = express.Router();
const asyncHandler = require('express-async-handler');
const { sequelize } = require('../config/db');

// Submit / upsert player progress
r.post('/player', asyncHandler(async (req, res) => {
  const { name, college, skill, streak, survival, quizPasses, rewards, days } = req.body;
  if (!name || !skill) { res.status(400); throw new Error('Name and skill required'); }

  await sequelize.query(`
    INSERT INTO deadline_players (name, college, skill, streak, survival, quiz_passes, rewards, days_survived, updated_at)
    VALUES (:name, :college, :skill, :streak, :survival, :quizPasses, :rewards, :days, NOW())
    ON CONFLICT (name, skill) DO UPDATE SET
      streak       = GREATEST(deadline_players.streak, EXCLUDED.streak),
      survival     = EXCLUDED.survival,
      quiz_passes  = EXCLUDED.quiz_passes,
      rewards      = EXCLUDED.rewards,
      days_survived = EXCLUDED.days_survived,
      updated_at   = NOW()
  `, {
    replacements: {
      name: name.trim().substring(0, 50),
      college: (college || 'Unknown College').substring(0, 100),
      skill, streak: streak || 0,
      survival: parseFloat(survival) || 72,
      quizPasses: quizPasses || 0,
      rewards: rewards || 0,
      days: days || 0,
    },
    type: sequelize.QueryTypes.INSERT,
  });

  res.json({ success: true });
}));

// Get global leaderboard
r.get('/leaderboard', asyncHandler(async (req, res) => {
  const rows = await sequelize.query(`
    SELECT
      name, college, skill, streak, survival,
      quiz_passes   AS "quizPasses",
      rewards,
      days_survived AS "daysSurvived",
      updated_at    AS "updatedAt"
    FROM deadline_players
    ORDER BY streak DESC, survival DESC, quiz_passes DESC
    LIMIT 100
  `, { type: sequelize.QueryTypes.SELECT });
  res.json({ success: true, data: rows });
}));

module.exports = r;
