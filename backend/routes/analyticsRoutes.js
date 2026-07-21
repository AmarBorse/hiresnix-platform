const express = require('express');
const r = express.Router();
const {
  cgpaVsPlacement, skillDemandAnalysis, salaryDistribution,
  departmentStats, placementTrends, companyStats
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

r.use(protect, authorize('admin'));

r.get('/cgpa-placement',      cgpaVsPlacement);
r.get('/skill-demand',        skillDemandAnalysis);
r.get('/salary-distribution', salaryDistribution);
r.get('/department-stats',    departmentStats);
r.get('/placement-trends',    placementTrends);
r.get('/company-stats',       companyStats);

// Alias for /admin/analytics calls from frontend
r.get('/',                    async (req, res) => {
  res.json({ success: true, message: 'Use specific endpoints' });
});

module.exports = r;
// ── Feature Usage Tracking ─────────────────────────────────────────
const FeatureUsage = require('../models/FeatureUsage');
const MockInterview = require('../models/MockInterview');
const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');

// POST /api/analytics/track — track feature usage (any logged in user)
r.post('/track', async (req, res) => {
  try {
    const { feature, action = 'view', metadata = {} } = req.body;
    if (!feature) return res.status(400).json({ success: false });
    await FeatureUsage.create({ userId: req.user?.id || null, feature, action, metadata });
    res.json({ success: true });
  } catch { res.json({ success: true }); } // silent fail
});

// GET /api/analytics/feature-usage — admin only
r.get('/feature-usage', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Feature usage counts
    const usageRaw = await sequelize.query(`
      SELECT feature, action, COUNT(*) as count
      FROM feature_usage
      WHERE "createdAt" >= :since
      GROUP BY feature, action
      ORDER BY count DESC
    `, { replacements: { since }, type: QueryTypes.SELECT });

    // Daily usage trend (last 7 days)
    const trendRaw = await sequelize.query(`
      SELECT 
        DATE("createdAt") as date,
        feature,
        COUNT(*) as count
      FROM feature_usage
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt"), feature
      ORDER BY date ASC
    `, { type: QueryTypes.SELECT });

    // Mock interview stats
    const mockStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        AVG(score) as avg_score,
        MAX(score) as top_score
      FROM mock_interviews
      WHERE "createdAt" >= :since
    `, { replacements: { since }, type: QueryTypes.SELECT });

    // Academy progress
    const academyStats = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT "studentId") as active_students,
        COUNT(*) as total_completions,
        AVG(progress) as avg_progress
      FROM inst_academy_progress
      WHERE "updatedAt" >= :since
    `, { replacements: { since }, type: QueryTypes.SELECT }).catch(() => [[{ active_students: 0, total_completions: 0, avg_progress: 0 }]]);

    // Internship applications
    const internshipStats = await sequelize.query(`
      SELECT COUNT(*) as total_applications
      FROM ip_applications
      WHERE "createdAt" >= :since
    `, { replacements: { since }, type: QueryTypes.SELECT });

    // Group usage by feature
    const featureMap = {};
    usageRaw.forEach((row) => {
      featureMap[row.feature] = (featureMap[row.feature] || 0) + parseInt(row.count);
    });

    res.json({
      success: true,
      data: {
        featureUsage: featureMap,
        usageDetails: usageRaw,
        trend: trendRaw,
        mockInterview: mockStats[0] || {},
        academy: academyStats[0][0] || {},
        internship: internshipStats[0] || {},
        period: `Last ${days} days`,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});