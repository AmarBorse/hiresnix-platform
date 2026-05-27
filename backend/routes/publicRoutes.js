const express = require('express');
const router = express.Router();
const { submitEnquiry } = require('../controllers/enquiryController');

/**
 * Public routes for Landing Page
 */

router.post('/enquiry', submitEnquiry);

module.exports = router;