// routes/signAssetsRoutes.js
// Serves the company signature + stamp images to the admin "Sign college form" tool.
//
//   GET /api/sign-assets        -> list of assets and whether each file exists
//   GET /api/sign-assets/:key   -> the PNG itself
//
// Only the main admin role can use this (sub-admins are blocked on purpose,
// because these images let someone sign documents in the company's name).
// The images live in backend/signatures/ — add the company stamp there as stamp.png.

const express = require('express');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');

const r = express.Router();

const DIR = path.join(__dirname, '..', 'signatures');

const ASSETS = {
  ceo:      { file: 'ceo.png',      label: 'Signature: Mr. A S Borse (Founder & CEO)', kind: 'signature' },
  director: { file: 'Director.png', label: 'Signature: Mr. Jayesh Badgujar (Program Director)', kind: 'signature' },
  stamp:    { file: 'stamp.png',    label: 'Company stamp', kind: 'stamp' },
};

// Strict admin check: 'admin' only, NOT sub-admin
const mainAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only the main admin can use signatures and the stamp' });
  }
  next();
};

r.get('/', protect, mainAdminOnly, (req, res) => {
  const data = Object.entries(ASSETS).map(([key, a]) => ({
    key,
    label: a.label,
    kind: a.kind,
    available: fs.existsSync(path.join(DIR, a.file)),
  }));
  res.json({ success: true, data });
});

r.get('/:key', protect, mainAdminOnly, (req, res) => {
  const asset = ASSETS[req.params.key];
  if (!asset) return res.status(404).json({ success: false, message: 'Unknown asset' });

  const filePath = path.join(DIR, asset.file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: `${asset.file} is missing in backend/signatures` });
  }

  console.log(`[sign-assets] ${req.user.email} loaded ${asset.file} at ${new Date().toISOString()}`);
  res.set('Cache-Control', 'private, no-store');
  res.type('png');
  res.sendFile(filePath);
});

module.exports = r;
