/**
 * controllers/adminController.js
 */

const asyncHandler = require('express-async-handler');
const { User, Student, Company, Job, Application } = require('../models');
const { Op } = require('sequelize');

// GET /api/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalStudents, totalCompanies, totalJobs, totalApplications, placedStudents, pendingJobs, pendingCompanies] =
    await Promise.all([
      Student.count(),
      Company.count(),
      Job.count({ where: { status: 'Approved' } }),
      Application.count(),
      Student.count({ where: { placementStatus: 'Placed' } }),
      Job.count({ where: { status: 'Pending' } }),
      Company.count({ where: { isVerified: false } }),
    ]);

  const recentApplications = await Application.findAll({
    order: [['createdAt', 'DESC']],
    limit: 5,
    include: [
      { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] },
      { model: Job, as: 'job', attributes: ['title'], include: [{ model: Company, as: 'company', attributes: ['companyName'] }] },
    ],
  });

  res.json({
    success: true,
    totalStudents, totalCompanies, totalJobs, totalApplications,
    placedStudents, pendingJobs, pendingCompanies,
    placementRate: totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0,
    data: {
      stats: {
        totalStudents, totalCompanies, totalJobs, totalApplications,
        placedStudents, pendingJobs, pendingCompanies,
        placementRate: totalStudents > 0 ? ((placedStudents / totalStudents) * 100).toFixed(1) : 0,
      },
      recentApplications,
    },
  });
});

// GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (search) where[Op.or] = [
    { name: { [Op.like]: `%${search}%` } },
    { email: { [Op.like]: `%${search}%` } },
  ];

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

// GET /api/companies  ← used by admin frontend
const getAllCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.findAll({
    include: [
      { model: User, as: 'user', attributes: ['name', 'email', 'isActive', 'isApproved'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, count: companies.length, data: companies });
});

// PUT /api/admin/companies/:id/approve  OR  /api/admin/companies/:id/verify
const approveCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.params.id);
  if (!company) { res.status(404); throw new Error('Company not found'); }

  // Support both { approved: true } and direct verify call
  const approved = req.body.approved !== undefined ? req.body.approved : true;

  await company.update({ isVerified: approved });
  await User.update({ isApproved: approved }, { where: { id: company.userId } });

  res.json({ success: true, message: `Company ${approved ? 'verified' : 'rejected'}`, data: company });
});

// PUT /api/admin/jobs/:id/approve
const approveJob = asyncHandler(async (req, res) => {
  const { approved, reason } = req.body;
  const job = await Job.findByPk(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }

  await job.update({
    status: approved ? 'Approved' : 'Rejected',
    ...(!approved && reason && { rejectionReason: reason }),
  });

  res.json({ success: true, message: `Job ${approved ? 'approved' : 'rejected'}`, data: job });
});

// PUT /api/admin/users/:id/toggle
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(403); throw new Error('Cannot deactivate admin accounts'); }

  await user.update({ isActive: !user.isActive });
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
});

// GET /api/admin/jobs/pending
const getPendingJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.findAll({
    where: { status: 'Pending' },
    include: [{ model: Company, as: 'company', attributes: ['companyName', 'logo'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, count: jobs.length, data: jobs });
});

// GET /api/students  ← used by admin frontend
const getAllStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, department, placement_status } = req.query;
  const where = {};
  if (department) where.department = department;
  if (placement_status) where.placementStatus = placement_status;

  const userWhere = {};
  if (search) {
    userWhere[Op.or] = [
      { name:  { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Student.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['name', 'email', 'isActive'], where: userWhere, required: false }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  res.json({
    success: true,
    total: count,
    totalPages: Math.ceil(count / parseInt(limit)),
    currentPage: parseInt(page),
    data: rows,
  });
});

// GET /api/admin/applications
const getAllApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const { count, rows } = await Application.findAndCountAll({
    include: [
      { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] },
      { model: Job, as: 'job', attributes: ['title'], include: [{ model: Company, as: 'company', attributes: ['companyName'] }] },
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  res.json({
    success: true,
    total: count,
    data: rows,
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  getAllCompanies,
  getAllStudents,
  getAllApplications,
  approveCompany,
  approveJob,
  toggleUserStatus,
  getPendingJobs,
};