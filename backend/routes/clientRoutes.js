/**
 * routes/clientRoutes.js
 */
const express = require('express');
const r = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, authorize } = require('../middleware/auth');
const { sequelize } = require('../config/db');

const admin = [protect, authorize('admin')];

// Public — get all active clients
r.get('/', asyncHandler(async (req, res) => {
  const rows = await sequelize.query(`
    SELECT * FROM hiresnix_clients WHERE is_active = true ORDER BY sort_order ASC, created_at DESC
  `, { type: sequelize.QueryTypes.SELECT });
  res.json({ success: true, data: rows });
}));

// Admin — get all clients
r.get('/all', ...admin, asyncHandler(async (req, res) => {
  const rows = await sequelize.query(`
    SELECT * FROM hiresnix_clients ORDER BY sort_order ASC, created_at DESC
  `, { type: sequelize.QueryTypes.SELECT });
  res.json({ success: true, data: rows });
}));

// Admin — create client
r.post('/', ...admin, asyncHandler(async (req, res) => {
  const { name, industry, location, tagline, what_we_built, tech_stack, results, is_active, sort_order, nda_protected } = req.body;
  if (!name) { res.status(400); throw new Error('Name required'); }

  await sequelize.query(`
    INSERT INTO hiresnix_clients (name, industry, location, tagline, what_we_built, tech_stack, results, is_active, sort_order, nda_protected)
    VALUES (:name, :industry, :location, :tagline, :what_we_built, :tech_stack, :results, :is_active, :sort_order, :nda_protected)
  `, {
    replacements: {
      name: name.trim(),
      industry: industry || '',
      location: location || '',
      tagline: tagline || '',
      what_we_built: JSON.stringify(what_we_built || []),
      tech_stack: JSON.stringify(tech_stack || []),
      results: JSON.stringify(results || []),
      is_active: is_active !== false,
      sort_order: sort_order || 0,
      nda_protected: nda_protected || false,
    },
    type: sequelize.QueryTypes.INSERT,
  });
  res.json({ success: true, message: 'Client added!' });
}));

// Admin — update client
r.put('/:id', ...admin, asyncHandler(async (req, res) => {
  const { name, industry, location, tagline, what_we_built, tech_stack, results, is_active, sort_order, nda_protected } = req.body;
  await sequelize.query(`
    UPDATE hiresnix_clients SET
      name = :name, industry = :industry, location = :location,
      tagline = :tagline, what_we_built = :what_we_built, tech_stack = :tech_stack,
      results = :results, is_active = :is_active, sort_order = :sort_order,
      nda_protected = :nda_protected, updated_at = NOW()
    WHERE id = :id
  `, {
    replacements: {
      id: req.params.id,
      name: name || '',
      industry: industry || '',
      location: location || '',
      tagline: tagline || '',
      what_we_built: JSON.stringify(what_we_built || []),
      tech_stack: JSON.stringify(tech_stack || []),
      results: JSON.stringify(results || []),
      is_active: is_active !== false,
      sort_order: sort_order || 0,
      nda_protected: nda_protected || false,
    },
    type: sequelize.QueryTypes.UPDATE,
  });
  res.json({ success: true, message: 'Client updated!' });
}));

// Admin — delete client
r.delete('/:id', ...admin, asyncHandler(async (req, res) => {
  await sequelize.query(`DELETE FROM hiresnix_clients WHERE id = :id`, {
    replacements: { id: req.params.id },
    type: sequelize.QueryTypes.DELETE,
  });
  res.json({ success: true, message: 'Client deleted!' });
}));

module.exports = r;
