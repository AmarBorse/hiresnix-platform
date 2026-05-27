/**
 * controllers/enquiryController.js
 * Public controller to handle submissions from the landing page.
 */
const asyncHandler = require('express-async-handler');
const { Enquiry } = require('../models');

// @desc    Submit a new enquiry from landing page
// @route   POST /api/enquiries
// @access  Public
const submitEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, interest, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Please provide name, email and message');
  }

  const enquiry = await Enquiry.create({ name, email, phone, interest, message });

  res.status(201).json({ success: true, data: enquiry, message: 'Enquiry submitted successfully' });
});

module.exports = { submitEnquiry };