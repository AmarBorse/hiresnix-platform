const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  getAllCompanies,
  getAllStudents,
  getAllApplications,
  approveCompany,
  approveJob,
  toggleUserStatus,
  getPendingJobs,
  getAllEnquiries,
  markEnquiryRead,
  deleteEnquiry
} = require('../controllers/adminController');

router.use(protect);
router.use(authorize('admin'));

router.get('/analytics', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/companies', getAllCompanies);
router.put('/companies/:id/approve', approveCompany);
router.get('/jobs/pending', getPendingJobs);
router.put('/jobs/:id/approve', approveJob);
router.get('/enquiries', getAllEnquiries);
router.put('/enquiries/:id/read', markEnquiryRead);
router.delete('/enquiries/:id', deleteEnquiry);

module.exports = router;