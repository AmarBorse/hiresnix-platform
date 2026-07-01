/**
 * controllers/studentController.js
 */

const asyncHandler = require('express-async-handler');
const path = require('path');
const axios = require('axios');
const { Student, User, Job, Company, Application, Enrollment, Certificate } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const { normalizeDomain, isValidDomain } = require('../utils/domains');
const { updateUserPassword } = require('../utils/passwords');
const {
  Domain,
  InternshipApplication,
  InternshipEnrollment,
  InternshipCertificate,
} = require('../models/internshipPlatform');

const departmentAliases = {
  cse: 'Computer Science',
  'computer science': 'Computer Science',
  cs: 'Computer Science',
  it: 'Information Technology',
  'information technology': 'Information Technology',
  ece: 'Electronics',
  electronics: 'Electronics',
  mech: 'Mechanical',
  mechanical: 'Mechanical',
  civil: 'Civil',
  mca: 'MCA',
  mba: 'MBA',
  other: 'Other',
};

const normalizeDepartment = value => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  return departmentAliases[normalized.toLowerCase()] || normalized;
};

// GET /api/students/profile
const getStudentProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({
    where: { userId: req.user.id },
    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
  });
  if (!student) { res.status(404); throw new Error('Profile not found'); }
  res.json({ success: true, data: student });
});

// PUT /api/students/profile
const updateStudentProfile = asyncHandler(async (req, res) => {
  const allowed = [
    'rollNumber','department','domain','year','cgpa','skills',
    'projects','certifications','education',
    'linkedin','github','portfolio',
  ];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  if (Object.prototype.hasOwnProperty.call(updates, 'department')) {
    updates.department = normalizeDepartment(updates.department);
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'domain')) {
    updates.domain = normalizeDomain(updates.domain);
    if (updates.domain && !isValidDomain(updates.domain)) {
      res.status(400);
      throw new Error('Please select a valid domain');
    }
  }

  let student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Profile not found'); }

  await student.update(updates);

  // Check profile completeness
  const complete = student.department && student.domain && student.year && student.cgpa && student.skills?.length > 0;
  await student.update({ isProfileComplete: !!complete });

  await student.reload({ include: [{ model: User, as: 'user', attributes: ['name','email'] }] });
  res.json({ success: true, data: student });
});

// PUT /api/students/resume
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload a valid resume (PDF or Word)'); }

  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Profile not found'); }

  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  let extractedSkills = [], analysisScore = 0;

  try {
    const ai = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/analyze-resume`,
      { resumePath: path.join(__dirname, '..', 'uploads', 'resumes', req.file.filename) },
      { timeout: 10000 }
    );
    extractedSkills = ai.data.skills || [];
    analysisScore   = ai.data.score  || 0;
  } catch (e) {
    console.warn('AI service unavailable:', e.message);
  }

  const mergedSkills = [...new Set([...(student.skills || []), ...extractedSkills])];

  await student.update({
    resumeFilename:       req.file.filename,
    resumeUrl,
    resumeUploadedAt:     new Date(),
    resumeExtractedSkills: extractedSkills,
    resumeAnalysisScore:  analysisScore,
    skills: mergedSkills,
  });

  res.json({ success: true, message: 'Resume uploaded successfully', data: { resumeUrl, extractedSkills, analysisScore } });
});

// GET /api/students/recommendations
const getJobRecommendations = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ where: { userId: req.user.id } });
  if (!student) { res.status(404); throw new Error('Profile not found'); }

  try {
    const ai = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/recommend-jobs`,
      { skills: student.skills, cgpa: student.cgpa, department: student.department, year: student.year },
      { timeout: 8000 }
    );
    res.json({ success: true, data: ai.data });
  } catch {
    const jobs = await Job.findAll({
      where: { status: 'Approved', applicationDeadline: { [Op.gte]: new Date() } },
      include: [{ model: Company, as: 'company', attributes: ['companyName','logo'] }],
      limit: 5,
    });
    res.json({ success: true, data: { recommendations: jobs, source: 'skill-match' } });
  }
});

// GET /api/students  (admin only)
const getAllStudents = asyncHandler(async (req, res) => {
  const { department, placementStatus, minCGPA, page = 1, limit = 20 } = req.query;
  const where = {};
  if (department)      where.department      = department;
  if (placementStatus) where.placementStatus = placementStatus;
  if (minCGPA)         where.cgpa            = { [Op.gte]: parseFloat(minCGPA) };

  const { count, rows } = await Student.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['name','email','isActive'] }],
    order: [['cgpa','DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
  });

  res.json({ success: true, total: count, data: rows });
});

// DELETE /api/students/:id  (admin only)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
  });

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const userId = student.userId;

  await sequelize.transaction(async (transaction) => {
    const platformEnrollments = await InternshipEnrollment.findAll({
      where: { userId },
      include: [{ model: Domain, as: 'domain' }],
      transaction,
    });

    for (const enrollment of platformEnrollments) {
      await InternshipCertificate.destroy({ where: { enrollmentId: enrollment.id }, transaction });
      if (enrollment.domain && enrollment.status !== 'Dropped') {
        await enrollment.domain.decrement('filledSeats', { by: 1, transaction });
      }
    }

    await InternshipEnrollment.destroy({ where: { userId }, transaction });
    await InternshipApplication.destroy({ where: { userId }, transaction });
    await Certificate.destroy({ where: { studentId: student.id }, transaction });
    await Enrollment.destroy({ where: { studentId: student.id }, transaction });
    await Application.destroy({
      where: {
        [Op.or]: [{ studentId: student.id }, { appliedById: userId }],
      },
      transaction,
    });
    await student.destroy({ transaction });
    await User.destroy({ where: { id: userId, role: 'student' }, transaction });
  });

  res.json({ success: true, message: 'Student deleted successfully' });
});

// PUT /api/students/:id/reset-password  (admin only)
const resetStudentPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters');
  }

  const student = await Student.findByPk(req.params.id, {
    include: [{ model: User, as: 'user' }],
  });

  if (!student || !student.user || student.user.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  await updateUserPassword(student.user, newPassword);
  res.json({ success: true, message: 'Password has been reset successfully.' });
});

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
  getJobRecommendations,
  getAllStudents,
  deleteStudent,
  resetStudentPassword,
};
