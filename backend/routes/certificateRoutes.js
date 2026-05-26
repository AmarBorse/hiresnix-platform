/**
 * routes/certificateRoutes.js
 */
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getMyCertificates, verifyCertificate, getAllCertificates } = require('../controllers/certificateController');

const r = express.Router();

r.get('/my',           protect, authorize('student'), getMyCertificates);
r.get('/verify/:certId', verifyCertificate); // public
r.get('/',             protect, authorize('admin'), getAllCertificates);

module.exports = r;
