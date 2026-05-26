/**
 * controllers/certificateController.js
 */
const asyncHandler = require('express-async-handler');
const { Certificate, Student, Enrollment, Internship } = require('../models');

// GET /api/certificates/my
const getMyCertificates = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Profile not found'); }

  const certs = await Certificate.findAll({
    where: { studentId: student.id, isValid: true },
    order: [['issuedAt', 'DESC']],
  });
  res.json({ success: true, count: certs.length, data: certs });
});

// GET /api/certificates/verify/:certId — public
const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await Certificate.findOne({
    where: { certificateId: req.params.certId },
  });
  if (!cert) { res.status(404); throw new Error('Certificate not found or invalid'); }
  res.json({ success: true, valid: cert.isValid, data: cert });
});

// GET /api/certificates — admin: all certs
const getAllCertificates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { count, rows } = await Certificate.findAndCountAll({
    include: [{ model: Student, as: 'student' }],
    order: [['issuedAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

module.exports = { getMyCertificates, verifyCertificate, getAllCertificates };
