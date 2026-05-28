const express = require('express');
const router = express.Router();
const { verifyCompany } = require('../controllers/adminController');
const { getAllEnquiries, markAsRead, deleteEnquiry } = require('../controllers/enquiryController');
// const { protect, authorize } = require('../middleware/auth');

// Admin Auth Middleware (uncomment when ready to secure)
// router.use(protect, authorize('admin'));

// Company Approval Routes (We add both in case frontend uses either one)
router.put('/companies/:id/verify', verifyCompany);
router.put('/companies/:id/verify/', verifyCompany);
router.put('/companies/:id/approve', verifyCompany);

// Enquiries Routes (for your Admin Dashboard)
router.get('/enquiries', getAllEnquiries);
router.put('/enquiries/:id/read', markAsRead);
router.delete('/enquiries/:id', deleteEnquiry);

module.exports = router;