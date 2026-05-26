/**
 * routes/internshipRoutes.js
 */
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getInternships, getInternship, createInternship, updateInternship,
  deleteInternship, enroll, getMyEnrollments, submitTaskLog,
} = require('../controllers/internshipController');

const r = express.Router();

r.get('/',    protect, getInternships);
r.get('/my',  protect, authorize('student'), getMyEnrollments);
r.get('/:id', protect, getInternship);

r.post('/',   protect, authorize('admin'), createInternship);
r.put('/:id', protect, authorize('admin'), updateInternship);
r.delete('/:id', protect, authorize('admin'), deleteInternship);

r.post('/:id/enroll', protect, authorize('student'), enroll);
r.post('/:enrollmentId/task-log', protect, authorize('student'), submitTaskLog);

module.exports = r;
