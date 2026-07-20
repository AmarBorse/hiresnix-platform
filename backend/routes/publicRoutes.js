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