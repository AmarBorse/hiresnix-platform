/**
 * controllers/analyticsController.js
 *
 * Identical to the original except raw SQL is updated for PostgreSQL:
 *   - Backtick identifiers  → double-quoted identifiers
 *   - MONTH(col)/YEAR(col)  → EXTRACT(MONTH FROM col) / EXTRACT(YEAR FROM col)
 *   - Integer division cast → ::NUMERIC cast for percentage calc
 */

const asyncHandler = require('express-async-handler');
const { sequelize } = require('../config/db');
const { Student, Job, Application, Company } = require('../models');
const { Op } = require('sequelize');

// GET /api/analytics/cgpa-placement
const cgpaVsPlacement = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT
      CASE
        WHEN cgpa >= 8 THEN '8-10'
        WHEN cgpa >= 7 THEN '7-8'
        WHEN cgpa >= 6 THEN '6-7'
        WHEN cgpa >= 5 THEN '5-6'
        ELSE '<5'
      END AS "range",
      COUNT(*) AS total,
      SUM(CASE WHEN "placementStatus" = 'Placed' THEN 1 ELSE 0 END) AS placed
    FROM students
    WHERE cgpa IS NOT NULL
    GROUP BY "range"
    ORDER BY "range" DESC
  `);
  const data = results.map(r => ({
    range: r.range, total: parseInt(r.total), placed: parseInt(r.placed),
    rate: r.total > 0 ? ((r.placed / r.total) * 100).toFixed(1) : 0,
  }));
  res.json({ success: true, data });
});

// GET /api/analytics/skill-demand
const skillDemandAnalysis = asyncHandler(async (req, res) => {
  const jobs = await Job.findAll({ where: { status: 'Approved' }, attributes: ['requiredSkills'] });
  const count = {};
  jobs.forEach(j => {
    (j.requiredSkills || []).forEach(s => {
      const k = s.toLowerCase().trim();
      count[k] = (count[k] || 0) + 1;
    });
  });
  const data = Object.entries(count)
    .map(([skill, c]) => ({ skill, count: c }))
    .sort((a, b) => b.count - a.count).slice(0, 15);
  res.json({ success: true, data });
});

// GET /api/analytics/salary-distribution
const salaryDistribution = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT
      CASE
        WHEN "placedSalary" < 300000  THEN '<3 LPA'
        WHEN "placedSalary" < 500000  THEN '3-5 LPA'
        WHEN "placedSalary" < 800000  THEN '5-8 LPA'
        WHEN "placedSalary" < 1200000 THEN '8-12 LPA'
        WHEN "placedSalary" < 2000000 THEN '12-20 LPA'
        ELSE '>20 LPA'
      END AS "range",
      COUNT(*) AS count
    FROM students
    WHERE "placementStatus" = 'Placed' AND "placedSalary" > 0
    GROUP BY "range"
  `);
  res.json({ success: true, data: results.map(r => ({ range: r.range, count: parseInt(r.count) })) });
});

// GET /api/analytics/department-stats
const departmentStats = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT
      department,
      COUNT(*) AS "totalStudents",
      SUM(CASE WHEN "placementStatus" = 'Placed' THEN 1 ELSE 0 END) AS "placedStudents",
      AVG(cgpa) AS "avgCGPA",
      AVG("placedSalary") AS "avgSalary"
    FROM students
    WHERE department IS NOT NULL
    GROUP BY department
    ORDER BY "placedStudents" DESC
  `);
  const data = results.map(r => ({
    department:     r.department,
    totalStudents:  parseInt(r.totalStudents),
    placedStudents: parseInt(r.placedStudents),
    placementRate:  r.totalStudents > 0 ? ((r.placedStudents / r.totalStudents) * 100).toFixed(1) : 0,
    avgCGPA:        r.avgCGPA ? parseFloat(r.avgCGPA).toFixed(2) : 0,
    avgSalary:      r.avgSalary ? Math.round(r.avgSalary / 100000) : 0,
  }));
  res.json({ success: true, data });
});

// GET /api/analytics/placement-trends
const placementTrends = asyncHandler(async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const [results] = await sequelize.query(`
    SELECT
      EXTRACT(MONTH FROM "placedOn") AS month,
      COUNT(*) AS placements,
      AVG("placedSalary") AS "avgSalary"
    FROM students
    WHERE "placementStatus" = 'Placed'
      AND EXTRACT(YEAR FROM "placedOn") = ${parseInt(year)}
    GROUP BY EXTRACT(MONTH FROM "placedOn")
    ORDER BY month
  `);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const data = months.map((m, i) => {
    const found = results.find(r => parseInt(r.month) === i + 1);
    return {
      month: m,
      placements: found ? parseInt(found.placements) : 0,
      avgSalary:  found?.avgSalary ? Math.round(found.avgSalary / 100000) : 0,
    };
  });
  res.json({ success: true, data });
});

// GET /api/analytics/company-stats
const companyStats = asyncHandler(async (req, res) => {
  const [results] = await sequelize.query(`
    SELECT
      c."companyName",
      COUNT(a.id) AS "totalApplications",
      SUM(CASE WHEN a.status = 'Selected'    THEN 1 ELSE 0 END) AS selected,
      SUM(CASE WHEN a.status = 'Shortlisted' THEN 1 ELSE 0 END) AS shortlisted,
      ROUND(
        SUM(CASE WHEN a.status = 'Selected' THEN 1 ELSE 0 END)::NUMERIC
        / COUNT(a.id) * 100, 1
      ) AS "selectionRatio"
    FROM applications a
    JOIN jobs j      ON a."jobId"     = j.id
    JOIN companies c ON j."companyId" = c.id
    GROUP BY c.id, c."companyName"
    ORDER BY selected DESC
    LIMIT 10
  `);
  res.json({ success: true, data: results });
});

module.exports = { cgpaVsPlacement, skillDemandAnalysis, salaryDistribution, departmentStats, placementTrends, companyStats };
