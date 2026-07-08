/**
 * controllers/adminController.js
 * Added: institution approval/reject/manage
 */
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { User, Student, Company, Job, Application, Certificate, Enquiry, Internship, Institution, InstitutionStudent, Batch, Course, InstitutionCertificate } = require('../models');

// ── Existing: verifyCompany ───────────────────────────────────────
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

// ── Existing: getAdminAnalytics ───────────────────────────────────
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [
    totalStudents, totalCompanies, totalJobs, totalApplications,
    placedStudents, pendingJobs, totalCertificates, unreadEnquiries, activeInternships, totalInstitutions,
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
    Institution.count(),
  ]);
  res.json({
    success: true,
    data: { totalStudents, totalCompanies, totalJobs, totalApplications, placedStudents, pendingJobs, totalCertificates, unreadEnquiries, activeInternships, totalInstitutions },
  });
});

// ── NEW: Institution Management ────────────────────────────────────

// GET /api/admin/institutions
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

// GET /api/admin/institutions/:id
const getInstitution = asyncHandler(async (req, res) => {
  const inst = await Institution.findByPk(req.params.id, {
    include: [{ model: User, as: 'user', attributes: ['name','email','isApproved','isActive','createdAt'] }],
  });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  const [studentCount, batchCount, courseCount, certCount] = await Promise.all([
    InstitutionStudent.count({ where: { institutionId: inst.id } }),
    Batch.count({ where: { institutionId: inst.id } }),
    Course.count({ where: { institutionId: inst.id } }),
    InstitutionCertificate.count({ where: { institutionId: inst.id } }),
  ]);
  res.json({ success: true, data: { ...inst.toJSON(), studentCount, batchCount, courseCount, certCount } });
});

// PUT /api/admin/institutions/:id/approve
const approveInstitution = asyncHandler(async (req, res) => {
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  inst.isVerified = true;
  inst.rejectionReason = null;
  await inst.save();
  if (inst.user) { inst.user.isApproved = true; await inst.user.save(); }
  res.json({ success: true, message: 'Institution approved successfully', data: inst });
});

// PUT /api/admin/institutions/:id/reject
const rejectInstitution = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  inst.isVerified = false;
  inst.rejectionReason = reason || 'Application rejected by admin';
  await inst.save();
  if (inst.user) { inst.user.isApproved = false; await inst.user.save(); }
  res.json({ success: true, message: 'Institution rejected', data: inst });
});

// DELETE /api/admin/institutions/:id
const deleteInstitution = asyncHandler(async (req, res) => {
  const inst = await Institution.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  if (inst.user) await inst.user.destroy(); // cascade deletes institution
  else await inst.destroy();
  res.json({ success: true, message: 'Institution deleted' });
});

// GET /api/admin/institutions/:id/verify-cert/:certId  (public cert verify via admin route)
const verifyInstitutionCertificate = asyncHandler(async (req, res) => {
  const cert = await InstitutionCertificate.findOne({ where: { certificateId: req.params.certId } });
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  res.json({ success: true, valid: cert.isValid, data: cert });
});

module.exports = {
  verifyCompany, getAdminAnalytics,
  getInstitutions, getInstitution, approveInstitution, rejectInstitution, deleteInstitution,
  verifyInstitutionCertificate,
};
