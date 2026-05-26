/**
 * controllers/resourceController.js
 */
const asyncHandler = require('express-async-handler');
const { Resource } = require('../models');
const { Op } = require('sequelize');

const getResources = asyncHandler(async (req, res) => {
  const { domain, type, search, page = 1, limit = 20 } = req.query;
  const where = { isPublic: true };
  if (domain) where.domain = { [Op.like]: `%${domain}%` };
  if (type)   where.type = type;
  if (search) where.title = { [Op.like]: `%${search}%` };

  const { count, rows } = await Resource.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const createResource = asyncHandler(async (req, res) => {
  const resource = await Resource.create({ ...req.body, createdById: req.user.id });
  res.status(201).json({ success: true, data: resource });
});

const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) { res.status(404); throw new Error('Not found'); }
  await resource.update(req.body);
  res.json({ success: true, data: resource });
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) { res.status(404); throw new Error('Not found'); }
  await resource.destroy();
  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getResources, createResource, updateResource, deleteResource };
