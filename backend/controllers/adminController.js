const asyncHandler = require('express-async-handler');
const { User, Company } = require('../models');

// PUT /api/admin/companies/:id/verify
const verifyCompany = asyncHandler(async (req, res) => {
  const id = req.params.id; // Frontend generally sends the User ID or Company ID
  
  const user = await User.findByPk(id);
  if (!user) {
    res.status(404);
    throw new Error('User/Company not found');
  }

  // Verify the company by updating the User table flag
  user.isApproved = true;
  await user.save();

  res.json({ success: true, message: 'Company verified successfully!' });
});

module.exports = { verifyCompany };