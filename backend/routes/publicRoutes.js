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

// Dynamic sitemap with public portfolio pages
router.get('/sitemap.xml', async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const { QueryTypes } = require('sequelize');

    // Get all students with projects (public portfolios)
    const students = await sequelize.query(`
      SELECT DISTINCT u.name 
      FROM users u 
      INNER JOIN projects p ON p."userId" = u.id
      WHERE u.role = 'student'
    `, { type: QueryTypes.SELECT });

    const baseUrl = 'https://hiresnix.co.in';
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/auth', priority: '0.8', changefreq: 'monthly' },
      { url: '/about-us', priority: '0.7', changefreq: 'monthly' },
      { url: '/contact-us', priority: '0.7', changefreq: 'monthly' },
      { url: '/internship-policy', priority: '0.6', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
      { url: '/terms-and-conditions', priority: '0.5', changefreq: 'monthly' },
      { url: '/refund-policy', priority: '0.4', changefreq: 'monthly' },
      { url: '/disclaimer', priority: '0.4', changefreq: 'monthly' },
      { url: '/company-information', priority: '0.5', changefreq: 'monthly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    staticPages.forEach(page => {
      xml += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });


    // Blog pages
    xml += `  <url>
    <loc>${baseUrl}/blog/best-internship-platforms-india-2026</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    xml += `  <url>
    <loc>${baseUrl}/blog/ai-mock-interview-kaise-prepare-karein</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    xml += `  <url>
    <loc>${baseUrl}/blog/resume-ats-score-kaise-badhayein</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    xml += `  <url>
    <loc>${baseUrl}/blog/tier-2-city-students-career-tips</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;

    // Dynamic portfolio pages
    students.forEach((s) => {
      const slug = s.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+$/g, '');
      if (slug) {
        xml += `  <url>
    <loc>${baseUrl}/projects/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
      }
    });

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('<?xml version="1.0"?><urlset></urlset>');
  }
});

// Update sitemap to include blog posts
// (Already handled in main sitemap route - blog slugs added below)