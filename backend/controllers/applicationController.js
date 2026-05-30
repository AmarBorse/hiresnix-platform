/**
 * controllers/applicationController.js
 */

const asyncHandler = require('express-async-handler');
const { Application, Job, Student, Company, User } = require('../models');

// POST /api/applications/:jobId
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findByPk(req.params.jobId);
  if (!job)                              { res.status(404); throw new Error('Job not found'); }
  if (job.status !== 'Approved')         { res.status(400); throw new Error('Job not accepting applications'); }
  // Disabled deadline check so you can freely test applying
  // if (new Date(job.applicationDeadline) < new Date()) { res.status(400); throw new Error('Application deadline passed'); }

  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student)            { res.status(404); throw new Error('Student profile not found'); }
  if (!student.resumeUrl)  { res.status(400); throw new Error('Please upload your resume before applying'); }

  const existing = await Application.findOne({ where: { jobId: job.id, studentId: student.id } });
  if (existing) { res.status(400); throw new Error('You have already applied to this job'); }

  const isEligible = parseFloat(student.cgpa) >= parseFloat(job.minCGPA);

  const app = await Application.create({
    jobId:          job.id,
    studentId:      student.id,
    appliedById:    req.user.id,
    coverLetter:    req.body.coverLetter,
    resumeFilename: student.resumeFilename,
    resumeUrl:      student.resumeUrl,
    isEligible,
    statusHistory: [{ status: 'Applied', changedAt: new Date() }],
  });

  await job.increment('applicationCount');
  res.status(201).json({ success: true, data: app });
});

// GET /api/applications/my
const getMyApplications = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Profile not found'); }

  const apps = await Application.findAll({
    where: { studentId: student.id },
    include: [{
      model: Job, as: 'job', attributes: ['id','title','type','salaryMin','salaryMax','location','applicationDeadline','status'],
      include: [{ model: Company, as: 'company', attributes: ['companyName','logo'] }],
    }],
    order: [['createdAt','DESC']],
  });
  res.json({ success: true, count: apps.length, data: apps });
});

// GET /api/applications
const getAllApplications = asyncHandler(async (req, res) => {
  const { status, limit = 200 } = req.query;
  const where = {};
  if (status) where.status = status;

  const apps = await Application.findAll({
    where,
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['cgpa','skills','department','year','resumeUrl','projects'],
        include: [{ model: User, as: 'user', attributes: ['name','email'] }],
      },
      {
        model: Job,
        as: 'job',
        attributes: ['title','type','salaryMin','salaryMax','location','status'],
        include: [{ model: Company, as: 'company', attributes: ['companyName','logo'] }],
      },
    ],
    order: [['createdAt','DESC']],
    limit: Math.min(parseInt(limit, 10) || 200, 1000),
  });

  res.json({ success: true, count: apps.length, data: apps });
});

// GET /api/applications/job/:jobId
const getJobApplicants = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = { jobId: req.params.jobId };
  if (status) where.status = status;

  const apps = await Application.findAll({
    where,
    include: [{
      model: Student, as: 'student',
      attributes: ['cgpa','skills','department','year','resumeUrl','projects'],
      include: [{ model: User, as: 'user', attributes: ['name','email'] }],
    }],
    order: [['matchScore','DESC'],['createdAt','DESC']],
  });
  res.json({ success: true, count: apps.length, data: apps });
});

// PUT /api/applications/:id/status
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note, interviewDetails } = req.body;
  const app = await Application.findByPk(req.params.id, {
    include: [{ model: Job, as: 'job', include: [{ model: Company, as: 'company' }] }],
  });
  if (!app) { res.status(404); throw new Error('Application not found'); }

  const valid = ['Under Review','Shortlisted','Interview Scheduled','Selected','Rejected'];
  if (!valid.includes(status)) { res.status(400); throw new Error('Invalid status'); }

  const history = app.statusHistory || [];
  history.push({ status, changedAt: new Date(), note });

  const updateData = { status, statusHistory: history };
  if (status === 'Interview Scheduled' && interviewDetails) {
    updateData.interviewAt       = interviewDetails.interviewAt || interviewDetails.scheduledAt;
    updateData.interviewMode     = interviewDetails.interviewMode || interviewDetails.mode;
    updateData.interviewLocation = interviewDetails.interviewLocation || interviewDetails.location;
    updateData.meetingLink       = interviewDetails.meetingLink;
  }

  await app.update(updateData);

  if (status === 'Selected') {
    const student = await Student.findByPk(app.studentId);
    await student.update({
      placementStatus: 'Placed',
      placedCompany:   app.job?.company?.companyName,
      placedRole:      app.job?.title,
      placedSalary:    app.job?.salaryMin,
      placedOn:        new Date(),
    });
  }

  res.json({ success: true, data: app });
});

// PUT /api/applications/:id/withdraw
const withdrawApplication = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  const app = await Application.findOne({ where: { id: req.params.id, studentId: student.id } });
  if (!app) { res.status(404); throw new Error('Application not found'); }
  if (['Selected','Rejected'].includes(app.status)) { res.status(400); throw new Error('Cannot withdraw a finalized application'); }
  await app.update({ status: 'Withdrawn' });
  res.json({ success: true, data: app });
});

module.exports = { applyToJob, getMyApplications, getAllApplications, getJobApplicants, updateApplicationStatus, withdrawApplication };
