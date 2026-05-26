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