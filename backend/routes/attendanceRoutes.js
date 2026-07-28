const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Student routes
router.post('/checkin',           protect, authorize('student'), attendanceController.checkIn);
router.post('/checkout',          protect, authorize('student'), attendanceController.checkOut);
router.get('/my',                 protect, authorize('student'), attendanceController.getMyAttendance);
router.get('/today',              protect, authorize('student'), attendanceController.getTodayStatus);
router.post('/leave',             protect, authorize('student'), attendanceController.applyLeave);
router.post('/self-add',          protect, authorize('student'), attendanceController.studentSelfAdd);

// Admin routes
router.get('/all',                      protect, authorize('admin'), attendanceController.getAllAttendance);
router.get('/student/:studentId',       protect, authorize('admin'), attendanceController.getStudentAttendance);
router.post('/admin-add',               protect, authorize('admin'), attendanceController.adminAddAttendance);
router.delete('/:id',                   protect, authorize('admin'), attendanceController.deleteAttendance);
router.put('/leave/:id/approve',        protect, authorize('admin'), attendanceController.approveLeave);
router.put('/leave/:id/reject',         protect, authorize('admin'), attendanceController.rejectLeave);
router.put('/mark-absent',              protect, authorize('admin'), attendanceController.markAbsent);
router.put('/toggle-self-add/:enrollmentId', protect, authorize('admin'), attendanceController.toggleSelfAdd);

module.exports = router;