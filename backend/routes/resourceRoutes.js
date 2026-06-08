/**
 * routes/resourceRoutes.js
 */
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getResources, getResource, createResource, updateResource, deleteResource } = require('../controllers/resourceController');

const r = express.Router();

r.get('/',    protect, authorize('student', 'admin'), getResources);
r.get('/:id', protect, authorize('student', 'admin'), getResource);
r.post('/',   protect, authorize('admin'), createResource);
r.put('/:id', protect, authorize('admin'), updateResource);
r.delete('/:id', protect, authorize('admin'), deleteResource);

module.exports = r;
