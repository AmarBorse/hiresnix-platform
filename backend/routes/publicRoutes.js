const express = require('express');
const router = express.Router();
const { submitEnquiry } = require('../controllers/enquiryController');

/**
 * Public routes for Landing Page
 */

router.post('/enquiry', submitEnquiry);

module.exports = router;
// Public: approved institutions list for internship form dropdown
router.get('/institutions-list', async (req, res) => {
  try {
    const { Institution, User } = require('../models');
    const institutions = await Institution.findAll({
      include: [{ model: User, as: 'user', where: { isApproved: true }, attributes: [] }],
      attributes: ['id', 'institutionName', 'city', 'state'],
      order: [['institutionName', 'ASC']],
    });
    res.json({ success: true, data: institutions });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// PDF text extraction endpoint
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    // Try pdf-parse
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      return res.json({ success: true, text: data.text });
    } catch (e) {
      // Fallback: extract readable text from buffer
      const buffer = req.file.buffer;
      let text = '';
      const str = buffer.toString('latin1');
      const matches = str.match(/\(([^\)]{2,200})\)\s*T[jJ]/g) || [];
      matches.forEach(m => {
        const t = m.replace(/^\(/, '').replace(/\)\s*T[jJ]$/, '').trim();
        const clean = t.replace(/[^\x20-\x7E]/g, ' ').trim();
        if (clean.length > 2) text += clean + ' ';
      });
      return res.json({ success: true, text: text.trim() || '' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'PDF extraction failed' });
  }
});