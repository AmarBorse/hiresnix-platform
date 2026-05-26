/**
 * controllers/internshipController.js
 */
const asyncHandler = require('express-async-handler');
const { Internship, Enrollment, Student, Certificate, User } = require('../models');
const { Op } = require('sequelize');

// GET /api/internships — list active internships (students) or all (admin)
const getInternships = asyncHandler(async (req, res) => {
  const { domain, search, page = 1, limit = 10 } = req.query;
  const where = {};
  if (req.user.role === 'student') where.status = 'Active';
  if (domain) where.domain = { [Op.like]: `%${domain}%` };
  if (search) where.title = { [Op.like]: `%${search}%` };

  const { count, rows } = await Internship.findAndCountAll({
    where,
    include: [{ model: User, as: 'createdBy', attributes: ['name'] }],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  // For students: attach their enrollment status
  if (req.user.role === 'student') {
    const student = await Student.findOne({ where: { userId: req.user.id } });
    if (student) {
      const enrollments = await Enrollment.findAll({ where: { studentId: student.id } });
      const enrollMap = Object.fromEntries(enrollments.map(e => [e.internshipId, e]));
      const data = rows.map(i => ({
        ...i.toJSON(),
        enrollment: enrollMap[i.id] || null,
      }));
      return res.json({ success: true, count: rows.length, total: count, data });
    }
  }

  res.json({ success: true, count: rows.length, total: count, data: rows });
});

// GET /api/internships/:id
const getInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByPk(req.params.id, {
    include: [{ model: User, as: 'createdBy', attributes: ['name'] }],
  });
  if (!internship) { res.status(404); throw new Error('Internship not found'); }
  res.json({ success: true, data: internship });
});

// POST /api/internships — admin only
const createInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.create({ ...req.body, createdById: req.user.id });
  res.status(201).json({ success: true, data: internship });
});

// PUT /api/internships/:id — admin only
const updateInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByPk(req.params.id);
  if (!internship) { res.status(404); throw new Error('Internship not found'); }
  await internship.update(req.body);
  res.json({ success: true, data: internship });
});

// DELETE /api/internships/:id — admin only
const deleteInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByPk(req.params.id);
  if (!internship) { res.status(404); throw new Error('Internship not found'); }
  await internship.destroy();
  res.json({ success: true, message: 'Internship deleted' });
});

// POST /api/internships/:id/enroll — student
const enroll = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Student profile not found'); }

  const internship = await Internship.findByPk(req.params.id);
  if (!internship || internship.status !== 'Active') {
    res.status(400); throw new Error('Internship not available');
  }

  const existing = await Enrollment.findOne({
    where: { studentId: student.id, internshipId: internship.id },
  });
  if (existing) { res.status(400); throw new Error('Already enrolled'); }

  const enrollment = await Enrollment.create({
    studentId: student.id,
    internshipId: internship.id,
    status: 'Enrolled',
  });
  await internship.increment('enrollmentCount');
  res.status(201).json({ success: true, data: enrollment });
});

// GET /api/internships/my — student's enrollments
const getMyEnrollments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Profile not found'); }

  const enrollments = await Enrollment.findAll({
    where: { studentId: student.id },
    include: [{ model: Internship, as: 'internship' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, count: enrollments.length, data: enrollments });
});

// POST /api/internships/:enrollmentId/task-log — submit task
const submitTaskLog = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  const enrollment = await Enrollment.findOne({
    where: { id: req.params.enrollmentId, studentId: student.id },
    include: [{ model: Internship, as: 'internship' }],
  });
  if (!enrollment) { res.status(404); throw new Error('Enrollment not found'); }

  const { title, description, githubUrl, taskId } = req.body;
  const log = {
    id: Date.now().toString(),
    title, description, githubUrl, taskId,
    submittedAt: new Date(),
    status: 'Pending',
    grade: null,
  };

  const logs = [...(enrollment.taskLogs || []), log];
  const completedTasks = taskId
    ? [...new Set([...(enrollment.completedTasks || []), taskId])]
    : enrollment.completedTasks || [];

  const totalTasks = enrollment.internship?.tasks?.length || 1;
  const progress = Math.min(100, Math.round((completedTasks.length / totalTasks) * 100));
  const status = progress >= 100 ? 'Completed' : 'In Progress';
  const completedAt = status === 'Completed' ? new Date() : null;

  await enrollment.update({ taskLogs: logs, completedTasks, progress, status, completedAt });

  // Auto-issue certificate if completed
  if (status === 'Completed' && !completedAt) {
    const user = await User.findByPk(req.user.id);
    await Certificate.create({
      studentId: student.id,
      enrollmentId: enrollment.id,
      internshipTitle: enrollment.internship.title,
      studentName: user.name,
      domain: enrollment.internship.domain,
    });
  }

  res.json({ success: true, data: enrollment });
});

module.exports = {
  getInternships, getInternship, createInternship, updateInternship,
  deleteInternship, enroll, getMyEnrollments, submitTaskLog,
};
