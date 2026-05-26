// ─── routes/companyRoutes.js ──────────────────────────────────────
const express = require('express');
const asyncHandler = require('express-async-handler');
const { Company } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const r = express.Router();

r.get('/profile', protect, authorize('company'), asyncHandler(async (req, res) => {
  const c = await Company.findOne({ where: { userId: req.user.id } });
  if (!c) { res.status(404); throw new Error('Not found'); }
  res.json({ success: true, data: c });
}));

r.put('/profile', protect, authorize('company'), asyncHandler(async (req, res) => {
  const allowed = ['companyName','industry','website','description','headquarters','employeeCount','contactName','contactDesignation','contactPhone'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const c = await Company.findOne({ where: { userId: req.user.id } });
  await c.update(updates);
  res.json({ success: true, data: c });
}));

r.get('/', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { User } = require('../models');
  const { Op }   = require('sequelize');
  const { verified, page = 1, limit = 20 } = req.query;
  const where = {};
  if (verified !== undefined) where.isVerified = verified === 'true';
  const { count, rows } = await Company.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['name','email','isActive','isApproved','createdAt'] }],
    order: [['createdAt','DESC']],
    limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
}));

module.exports = r;
