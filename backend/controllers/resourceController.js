/**
 * controllers/resourceController.js
 */
const asyncHandler = require('express-async-handler');
const { Resource, Student } = require('../models');
const { Op } = require('sequelize');
const { normalizeDomain, isValidDomain } = require('../utils/domains');

const getResources = asyncHandler(async (req, res) => {
  const { domain, type, search, page = 1, limit = 20 } = req.query;
  const where = {};

  if (req.user.role === 'student') {
    const student = await Student.findOne({ where: { userId: req.user.id }, attributes: ['domain'] });
    where.isPublic = true;
    where.domain = student?.domain || '__NO_STUDENT_DOMAIN__';
  } else if (domain) {
    const requestedDomain = normalizeDomain(domain);
    if (!isValidDomain(requestedDomain)) {
      res.status(400);
      throw new Error('Please select a valid domain');
    }
    where.domain = requestedDomain;
  }

  if (type)   where.type = type;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const { count, rows } = await Resource.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const getResource = asyncHandler(async (req, res) => {
  const where = { id: req.params.id };

  if (req.user.role === 'student') {
    const student = await Student.findOne({ where: { userId: req.user.id }, attributes: ['domain'] });
    where.isPublic = true;
    where.domain = student?.domain || '__NO_STUDENT_DOMAIN__';
  }

  const resource = await Resource.findOne({ where });
  if (!resource) { res.status(404); throw new Error('Resource not found'); }
  res.json({ success: true, data: resource });
});

const createResource = asyncHandler(async (req, res) => {
  const domain = normalizeDomain(req.body.domain);
  if (!isValidDomain(domain)) {
    res.status(400);
    throw new Error('Please assign a valid domain to this resource');
  }
  const resource = await Resource.create({ ...req.body, domain, createdById: req.user.id });
  res.status(201).json({ success: true, data: resource });
});

const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) { res.status(404); throw new Error('Not found'); }
  const updates = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(updates, 'domain')) {
    updates.domain = normalizeDomain(updates.domain);
    if (!isValidDomain(updates.domain)) {
      res.status(400);
      throw new Error('Please assign a valid domain to this resource');
    }
  }
  await resource.update(updates);
  res.json({ success: true, data: resource });
});

const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findByPk(req.params.id);
  if (!resource) { res.status(404); throw new Error('Not found'); }
  await resource.destroy();
  res.json({ success: true, message: 'Deleted' });
});

module.exports = { getResources, getResource, createResource, updateResource, deleteResource };
