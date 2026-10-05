const express = require('express');
const jwt = require('jsonwebtoken');
const r = express.Router();
const {
  cgpaVsPlacement, skillDemandAnalysis, salaryDistribution,
  departmentStats, placementTrends, companyStats
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');
const FeatureUsage = require('../models/FeatureUsage');
const { sequelize } = require('../config/db');
const { QueryTypes } = require('sequelize');

// ── PUBLIC-ISH: feature usage tracking ─────────────────────────────
// Must be registered BEFORE the admin-only guard below. Students, institution
// students and companies all call this, so it only reads the token if present
// and never blocks the request.
r.post('/track', async (req, res) => {
  try {
    const { feature, action = 'view', metadata = {} } = req.body || {};
    if (!feature) return res.status(400).json({ success: false });

    let userId = null;
    let metadataExtra = {};
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        // Institution-student tokens use a different id space (not the users
        // table), so record them in metadata instead of userId.
        if (decoded?.role === 'inst_student') metadataExtra = { instStudentId: decoded.id };
        else userId = decoded?.id || null;
      } catch { /* bad/expired token → track anonymously */ }
    }

    await FeatureUsage.create({
      userId,
      feature: String(feature).slice(0, 100),
      action: String(action).slice(0, 50),
      metadata: { ...(metadata && typeof metadata === 'object' ? metadata : {}), ...metadataExtra },
    });
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // silent fail — tracking must never break the UI
  }
});

// ── Everything below is ADMIN ONLY ─────────────────────────────────
r.use(protect, authorize('admin'));

r.get('/cgpa-placement',      cgpaVsPlacement);
r.get('/skill-demand',        skillDemandAnalysis);
r.get('/salary-distribution', salaryDistribution);
r.get('/department-stats',    departmentStats);
r.get('/placement-trends',    placementTrends);
r.get('/company-stats',       companyStats);

r.get('/', (req, res) => {
  res.json({ success: true, message: 'Use specific endpoints' });
});

// GET /api/analytics/feature-usage
r.get('/feature-usage', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const usageRaw = await sequelize.query(`
      SELECT feature, action, COUNT(*) as count
      FROM feature_usage
      WHERE "createdAt" >= :since
      GROUP BY feature, action
      ORDER BY count DESC
    `, { replacements: { since }, type: QueryTypes.SELECT });

    const trendRaw = await sequelize.query(`
      SELECT DATE("createdAt") as date, feature, COUNT(*) as count
      FROM feature_usage
      WHERE "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt"), feature
      ORDER BY date ASC
    `, { type: QueryTypes.SELECT });

    const mockStats = await sequelize.query(`
      SELECT COUNT(*) as total, AVG(score) as avg_score, MAX(score) as top_score
      FROM mock_interviews
      WHERE "createdAt" >= :since
    `, { replacements: { since }, type: QueryTypes.SELECT }).catch(() => [{}]);

    const academyStats = await sequelize.query(`
      SELECT COUNT(DISTINCT "studentId") as active_students,
             COUNT(*) as total_completions,
             AVG(progress) as avg_progress
      FROM inst_academy_progress
      WHERE "updatedAt" >= :since
    `, { replacements: { since }, type: QueryTypes.SELECT })
      .catch(() => [{ active_students: 0, total_completions: 0, avg_progress: 0 }]);

    const internshipStats = await sequelize.query(`
      SELECT COUNT(*) as total_applications
      FROM ip_applications
      WHERE "createdAt" >= :since
    `, { replacements: { since }, type: QueryTypes.SELECT }).catch(() => [{}]);

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
        academy: academyStats[0] || {},
        internship: internshipStats[0] || {},
        period: `Last ${days} days`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = r;
