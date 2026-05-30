const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const { Enquiry } = require('../models');

const escapeHtml = value => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const sendEnquiryNotification = async ({ name, email, phone, interest, message }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Skipping enquiry email: EMAIL_USER or EMAIL_PASS is not configured');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Platform Enquiry: ${interest || 'General'} - from ${name}`,
    html: `
      <h2>New Enquiry Received on Hiresnix</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
      <p><strong>Interest:</strong> ${escapeHtml(interest || 'General')}</p>
      <hr />
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
    `,
  });
};

// POST /api/public/enquiry
const submitEnquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, interest, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error('Please provide your name, email, and a message');
  }

  // Save first so the admin dashboard receives the enquiry even if email is slow.
  await Enquiry.create({ name, email, phone, interest, message });

  res.status(201).json({ success: true, message: 'Enquiry received successfully!' });

  sendEnquiryNotification({ name, email, phone, interest, message })
    .catch(err => console.error('Failed to send enquiry email:', err.message));
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
