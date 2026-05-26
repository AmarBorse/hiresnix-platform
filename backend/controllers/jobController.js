/**
 * controllers/jobController.js
 */

const asyncHandler = require('express-async-handler');
const { Job, Company, Student, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/jobs
const getJobs = asyncHandler(async (req, res) => {
  const { type, search, page = 1, limit = 10 } = req.query;
  const where = {};

  if (req.user.role === 'student') {
    where.status = 'Approved';
    // Temporarily disabled deadline check so all approved jobs show up during testing
    // where.applicationDeadline = { [Op.gte]: new Date() };
  }
  if (type)   where.type  = type;
  if (search) where.title = { [Op.like]: `%${search}%` };

  const { count, rows } = await Job.findAndCountAll({
    where,
    include: [{ model: Company, as: 'company', attributes: ['companyName','logo','industry','headquarters'] }],
    order: [['createdAt', 'DESC']],
    limit:  parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  res.json({ success: true, count: rows.length, total: count, totalPages: Math.ceil(count / parseInt(limit)), currentPage: parseInt(page), data: rows });
});

// GET /api/jobs/:id
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id, {
    include: [
      { model: Company, as: 'company', attributes: ['companyName','logo','industry','website','description','headquarters'] },
      { model: User,    as: 'postedBy', attributes: ['name','email'] },
    ],
  });
  if (!job) { res.status(404); throw new Error('Job not found'); }

  let eligibilityStatus = null;
  if (req.user.role === 'student') {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (student) {
      const reasons = [];
      if (parseFloat(student.cgpa) < parseFloat(job.minCGPA))
        reasons.push(`Min CGPA: ${job.minCGPA} (yours: ${student.cgpa})`);
      if (job.allowedDepartments?.length && !job.allowedDepartments.includes(student.department))
        reasons.push(`Department not eligible`);
      eligibilityStatus = { eligible: reasons.length === 0, reasons };
    }
  }
  res.json({ success: true, data: job, eligibilityStatus });
});

// POST /api/jobs
const createJob = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });

  if (!company) {
    res.status(404);
    throw new Error('You must completely fill out your Company Profile before posting a job.');
  }
  // if (!company?.isVerified) { res.status(403); throw new Error('Company must be verified before posting jobs'); }

  const job = await Job.create({ ...req.body, companyId: company.id, postedById: req.user.id, status: 'Approved' });
  res.status(201).json({ success: true, data: job });
});

// PUT /api/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }
  if (req.user.role === 'company' && job.postedById !== req.user.id) {
    res.status(403); throw new Error('Not authorized');
  }
  await job.update(req.body);
  res.json({ success: true, data: job });
});

// DELETE /api/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  if (!job) { res.status(404); throw new Error('Job not found'); }
  if (req.user.role !== 'admin' && job.postedById !== req.user.id) {
    res.status(403); throw new Error('Not authorized');
  }
  await job.destroy();
  res.json({ success: true, message: 'Job deleted' });
});

// GET /api/jobs/my-postings
const getMyJobPostings = asyncHandler(async (req, res) => {
  const company = await Company.findOne({ where: { userId: req.user.id } });
  if (!company) { res.status(404); throw new Error('Company profile not found'); }
  const jobs = await Job.findAll({ where: { companyId: company.id }, order: [['createdAt','DESC']] });
  res.json({ success: true, count: jobs.length, data: jobs });
});

module.exports = { getJobs, getJob, createJob, updateJob, deleteJob, getMyJobPostings };
