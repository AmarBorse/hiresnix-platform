/**
 * controllers/adminController.js
 */
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { User, Student, Company, Job, Application, Certificate, Enquiry, Internship, Institution, InstitutionStudent, Batch, Course, InstitutionCertificate } = require('../models');
const bcrypt = require('bcryptjs');

// ── verifyCompany ─────────────────────────────────────────────────
const verifyCompany = asyncHandler(async (req, res) => {
  const id = req.params.id;
  let company = await Company.findByPk(id, { include: [{ model: User, as: 'user' }] });
  if (!company) company = await Company.findOne({ where: { userId: id }, include: [{ model: User, as: 'user' }] });
  if (!company) { res.status(404); throw new Error('Company not found'); }
  company.isVerified = true;
  await company.save();
  if (company.user) { company.user.isApproved = true; await company.user.save(); }
  res.json({ success: true, message: 'Company verified successfully!', data: company });
});

// ── getAdminAnalytics ─────────────────────────────────────────────
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [
    totalStudents, totalCompanies, totalJobs, totalApplications,
    placedStudents, pendingJobs, totalCertificates, unreadEnquiries,
    activeInternships, totalInstitutions,
  ] = await Promise.all([
    Student.count(), Company.count(), Job.count(), Application.count(),
    Student.count({ where: { placementStatus: 'Placed' } }),
    Job.count({ where: { status: 'Pending' } }),
    Certificate.count(),
    Enquiry.count({ where: { isRead: false } }),
    Internship.count({ where: { status: { [Op.in]: ['Active','Open','Approved'] } } }).catch(() => 0),
    Institution.count(),
  ]);
  res.json({ success: true, data: { totalStudents, totalCompanies, totalJobs, totalApplications, placedStudents, pendingJobs, totalCertificates, unreadEnquiries, activeInternships, totalInstitutions } });
});

// ── Institution Management ────────────────────────────────────────

const getInstitutions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const userWhere = {};
  if (status === 'pending')  userWhere.isApproved = false;
  if (status === 'approved') userWhere.isApproved = true;
  const { count, rows } = await Institution.findAndCountAll({
    include: [{ model: User, as: 'user', where: userWhere, attributes: ['name','email','isApproved','isActive','createdAt'] }],
    order: [['createdAt','DESC']],
    limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const getInstitution = asyncHandler(async (req, res) => {
  const { BatchStudent } = require('../models');
  const inst = await Institution.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['name','email','isApproved','isActive','createdAt'] }],
  });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }

  const [studentCount, courseCount, certCount, batches] = await Promise.all([
    InstitutionStudent.count({ where: { institutionId: inst.id } }),
    Course.count({ where: { institutionId: inst.id } }),
    InstitutionCertificate.count({ where: { institutionId: inst.id } }),
    Batch.findAll({ where: { institutionId: inst.id }, order: [['createdAt','DESC']] }),
  ]);

  // Per batch student count
  const batchesWithCount = await Promise.all(batches.map(async (b) => {
    const count = await BatchStudent.count({ where: { batchId: b.id } });
    return { ...b.toJSON(), studentCount: count };
  }));

  res.json({ success: true, data: {
    ...inst.toJSON(),
    studentCount,
    batchCount: batches.length,
    batchesWithCount,
    courseCount,
    certCount,
  }});
});

const approveInstitution = asyncHandler(async (req, res) => {
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  inst.isVerified = true; inst.rejectionReason = null;
  await inst.save();
  if (inst.user) { inst.user.isApproved = true; await inst.user.save(); }
  res.json({ success: true, message: 'Institution approved', data: inst });
});

const rejectInstitution = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  inst.isVerified = false; inst.rejectionReason = reason || 'Rejected by admin';
  await inst.save();
  if (inst.user) { inst.user.isApproved = false; await inst.user.save(); }
  res.json({ success: true, message: 'Institution rejected', data: inst });
});

const deleteInstitution = asyncHandler(async (req, res) => {
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  if (inst.user) await inst.user.destroy();
  else await inst.destroy();
  res.json({ success: true, message: 'Institution deleted' });
});

// ── Password Reset ────────────────────────────────────────────────

// Reset Institution Admin password
const resetInstitutionPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400); throw new Error('Min 6 characters required'); }
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst || !inst.user) { res.status(404); throw new Error('Institution not found'); }
  const { updateUserPassword } = require('../utils/passwords');
  await updateUserPassword(inst.user, newPassword);
  res.json({ success: true, message: `Password reset for ${inst.institutionName}` });
});

// Reset individual institution student password
const resetInstStudentPassword = asyncHandler(async (req, res) => {
  const { studentId, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) { res.status(400); throw new Error('Min 6 characters required'); }
  const student = await InstitutionStudent.findOne({ where: { id: studentId, institutionId: req.params.id } });
  if (!student) { res.status(404); throw new Error('Student not found'); }
  const hashed = await bcrypt.hash(newPassword, 10);
  await student.update({ password: hashed });
  res.json({ success: true, message: `Password reset for ${student.name}` });
});

// Reset ALL students of institution to default password (HX@XXXXXX)
const resetAllStudentPasswords = asyncHandler(async (req, res) => {
  const students = await InstitutionStudent.findAll({ where: { institutionId: req.params.id } });
  let count = 0;
  for (const s of students) {
    if (!s.careerId) continue;
    const defaultPwd = `HX@${s.careerId.split('-')[2]}`;
    const hashed = await bcrypt.hash(defaultPwd, 10);
    await s.update({ password: hashed });
    count++;
  }
  res.json({ success: true, message: `Passwords reset for ${count} students to default (HX@XXXXXX)` });
});

module.exports = {
  verifyCompany, getAdminAnalytics,
  getInstitutions, getInstitution, approveInstitution, rejectInstitution, deleteInstitution,
  resetInstitutionPassword, resetInstStudentPassword, resetAllStudentPasswords,
};