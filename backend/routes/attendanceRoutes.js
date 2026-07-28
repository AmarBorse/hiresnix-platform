const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/auth');
const attendanceController = require('../controllers/attendanceController');

// Student routes
router.post('/checkin', verifyToken, checkRole('student'), attendanceController.checkIn);
router.post('/checkout', verifyToken, checkRole('student'), attendanceController.checkOut);
router.get('/my', verifyToken, checkRole('student'), attendanceController.getMyAttendance);
router.get('/today', verifyToken, checkRole('student'), attendanceController.getTodayStatus);
router.post('/leave', verifyToken, checkRole('student'), attendanceController.applyLeave);

// Admin routes
router.get('/all', verifyToken, checkRole('admin'), attendanceController.getAllAttendance);
router.put('/leave/:id/approve', verifyToken, checkRole('admin'), attendanceController.approveLeave);
router.put('/leave/:id/reject', verifyToken, checkRole('admin'), attendanceController.rejectLeave);
router.put('/mark-absent', verifyToken, checkRole('admin'), attendanceController.markAbsent);

module.exports = router;
