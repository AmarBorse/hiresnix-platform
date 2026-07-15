// backend/controllers/mockInterviewController.js
const asyncHandler = require('express-async-handler');
const MockInterview = require('../models/MockInterview');
const { Op } = require('sequelize');

// POST /api/mock-interview/save
const saveMockInterview = asyncHandler(async (req, res) => {
  const { domain, round, difficulty, experience, overallScore, totalQuestions,
          communication, technical, confidence, grammar, problemSolving,
          weakTopics, results, duration } = req.body;

  const interview = await MockInterview.create({
    userId: req.user.id,
    domain, round, difficulty, experience,
    overallScore: overallScore || 0,
    totalQuestions: totalQuestions || 0,
    communication: communication || 0,
    technical: technical || 0,
    confidence: confidence || 0,
    grammar: grammar || 0,
    problemSolving: problemSolving || 0,
    weakTopics: JSON.stringify(weakTopics || []),
    results: JSON.stringify((results || []).slice(0, 20)),
    duration: duration || 0,
  });

  res.status(201).json({ success: true, data: interview });
});

// GET /api/mock-interview/my
const getMyInterviews = asyncHandler(async (req, res) => {
  const interviews = await MockInterview.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });

  // Analytics
  const total = interviews.length;
  const bestScore = total ? Math.max(...interviews.map(i => i.overallScore)) : 0;
  const avgScore  = total ? Math.round(interviews.reduce((s, i) => s + i.overallScore, 0) / total) : 0;

  // Weak topics aggregated
  const allWeak = interviews.flatMap(i => { try { return JSON.parse(i.weakTopics); } catch { return []; } });
  const weakMap: Record<string, number> = {};
  allWeak.forEach(t => { weakMap[t] = (weakMap[t] || 0) + 1; });
  const topWeak = Object.entries(weakMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t);

  // Domain breakdown
  const domainMap: Record<string, number[]> = {};
  interviews.forEach(i => {
    if (!domainMap[i.domain]) domainMap[i.domain] = [];
    domainMap[i.domain].push(i.overallScore);
  });
  const domainStats = Object.entries(domainMap).map(([domain, scores]) => ({
    domain,
    count: scores.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  })).sort((a, b) => b.avgScore - a.avgScore);

  // Weekly progress (last 7 days)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekly = interviews.filter(i => new Date(i.createdAt) >= weekAgo);

  // Streak
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let d = 0; d < 30; d++) {
    const day = new Date(today); day.setDate(today.getDate() - d);
    const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1);
    const hasInterview = interviews.some(i => {
      const date = new Date(i.createdAt);
      return date >= day && date < nextDay;
    });
    if (hasInterview) streak++;
    else if (d > 0) break;
  }

  // Total time
  const totalTime = interviews.reduce((s, i) => s + (i.duration || 0), 0);

  res.json({
    success: true,
    data: {
      interviews: interviews.map(i => ({
        ...i.toJSON(),
        weakTopics: (() => { try { return JSON.parse(i.weakTopics); } catch { return []; } })(),
        results: (() => { try { return JSON.parse(i.results); } catch { return []; } })(),
      })),
      analytics: { total, bestScore, avgScore, topWeak, domainStats, weeklyCount: weekly.length, streak, totalTime },
    },
  });
});

// DELETE /api/mock-interview/:id
const deleteMockInterview = asyncHandler(async (req, res) => {
  const interview = await MockInterview.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!interview) { res.status(404); throw new Error('Not found'); }
  await interview.destroy();
  res.json({ success: true });
});

module.exports = { saveMockInterview, getMyInterviews, deleteMockInterview };
