const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const { Enquiry } = require('../models');

// POST /api/public/enquiry
const submitEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, interest, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Please provide your name, email, and a message');
  }

  // 1. Save the enquiry to the Database so it appears in the Admin Dashboard
  await Enquiry.create({ name, email, phone, interest, message });

  // Setup Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like Outlook, Yahoo, etc.
    auth: {
      user: process.env.EMAIL_USER, // Your sender email (e.g., info@hiresnix.co.in)
      pass: process.env.EMAIL_PASS, // Your email App Password
    },
  });

  // Email Options for Admin
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER, // The Admin's email address who should receive it
    subject: `New Platform Enquiry: ${interest} - from ${name}`,
    html: `
      <h2>New Enquiry Received on Hiresnix</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
      <p><strong>Interest:</strong> ${interest}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  // Send the email
  await transporter.sendMail(mailOptions);
  res.status(200).json({ success: true, message: 'Enquiry sent successfully!' });
});

// GET /api/admin/enquiries
const getAllEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.findAll({ order: [['createdAt', 'DESC']] });
  res.json({ success: true, data: enquiries });
});

// PUT /api/admin/enquiries/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByPk(req.params.id);
  if (!enquiry) { res.status(404); throw new Error('Enquiry not found'); }
  await enquiry.update({ isRead: true });
  res.json({ success: true, data: enquiry });
});

// DELETE /api/admin/enquiries/:id
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByPk(req.params.id);
  if (!enquiry) { res.status(404); throw new Error('Enquiry not found'); }
  await enquiry.destroy();
  res.json({ success: true, message: 'Enquiry deleted' });
});

module.exports = { submitEnquiry, getAllEnquiries, markAsRead, deleteEnquiry };