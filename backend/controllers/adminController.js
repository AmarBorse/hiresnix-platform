const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { User, Student, Company, Job, Application, Certificate, Enquiry, Internship } = require('../models');

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

// GET /api/admin/analytics
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalCompanies,
    totalJobs,
    totalApplications,
    placedStudents,
    pendingJobs,
    totalCertificates,
    unreadEnquiries,
    activeInternships,
  ] = await Promise.all([
    Student.count(),
    Company.count(),
    Job.count(),
    Application.count(),
    Student.count({ where: { placementStatus: 'Placed' } }),
    Job.count({ where: { status: 'Pending' } }),
    Certificate.count(),
    Enquiry.count({ where: { isRead: false } }),
    Internship.count({ where: { status: { [Op.in]: ['Active', 'Open', 'Approved'] } } }).catch(() => 0),
  ]);

  res.json({
    success: true,
    data: {
      totalStudents,
      totalCompanies,
      totalJobs,
      totalApplications,
      placedStudents,
      pendingJobs,
      totalCertificates,
      unreadEnquiries,
      activeInternships,
    },
  });
});

module.exports = { verifyCompany, getAdminAnalytics };
