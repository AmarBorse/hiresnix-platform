const asyncHandler = require('express-async-handler');
const { User, Company } = require('../models');

// PUT /api/admin/companies/:id/verify
const verifyCompany = asyncHandler(async (req, res) => {
  const id = req.params.id;
  let company = await Company.findByPk(id, {
    include: [{ model: User, as: 'user' }],
  });

  if (!company) {
    company = await Company.findOne({
      where: { userId: id },
      include: [{ model: User, as: 'user' }],
    });
  }

  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  company.isVerified = true;
  await company.save();

  if (company.user) {
    company.user.isApproved = true;
    await company.user.save();
  }

  res.json({
    success: true,
    message: 'Company verified successfully!',
    data: company,
  });
});

module.exports = { verifyCompany };
