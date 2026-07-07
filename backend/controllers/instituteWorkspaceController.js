/**
 * controllers/instituteWorkspaceController.js
 * Tenant-scoped CRUD for the logged-in institution's own workspace:
 * courses, batches, students, assessments, assignments, certificates.
 * Every query is scoped to req.institutionId (see middleware/institution.js).
 */

const asyncHandler = require('express-async-handler');
const {
  InstituteCourse, InstituteBatch, InstituteStudent,
  InstituteAssessment, InstituteAssignment, InstituteCertificate,
} = require('../models');

function makeCrud(Model, { toDto, beforeCreate, beforeUpdate, include } = {}) {
  const dto = toDto || ((row) => row.toJSON());

  const list = asyncHandler(async (req, res) => {
    const rows = await Model.findAll({
      where: { institutionId: req.institutionId },
      order: [['createdAt', 'DESC']],
      include,
    });
    res.json({ success: true, data: rows.map(dto) });
  });

  const create = asyncHandler(async (req, res) => {
    const payload = beforeCreate ? await beforeCreate(req) : req.body;
    const row = await Model.create({ ...payload, institutionId: req.institutionId });
    const full = include ? await Model.findByPk(row.id, { include }) : row;
    res.status(201).json({ success: true, data: dto(full) });
  });

  const update = asyncHandler(async (req, res) => {
    const row = await Model.findOne({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!row) { res.status(404); throw new Error('Not found'); }
    const payload = beforeUpdate ? await beforeUpdate(req, row) : req.body;
    await row.update(payload);
    const full = include ? await Model.findByPk(row.id, { include }) : row;
    res.json({ success: true, data: dto(full) });
  });

  const remove = asyncHandler(async (req, res) => {
    const row = await Model.findOne({ where: { id: req.params.id, institutionId: req.institutionId } });
    if (!row) { res.status(404); throw new Error('Not found'); }
    await row.destroy();
    res.json({ success: true, message: 'Deleted' });
  });

  return { list, create, update, remove };
}

// ── Courses ──────────────────────────────────────────────────────
const courses = makeCrud(InstituteCourse);

// ── Batches ──────────────────────────────────────────────────────
const batches = makeCrud(InstituteBatch, {
  include: [{ model: InstituteCourse, as: 'course', attributes: ['id', 'title'] }],
  toDto: (row) => ({ ...row.toJSON(), courseName: row.course?.title || null }),
});

// ── Students ─────────────────────────────────────────────────────
function generateCareerId() {
  const year = new Date().getFullYear();
  return `HX-${year}-${String(Date.now()).slice(-6)}`;
}

const students = makeCrud(InstituteStudent, {
  include: [{ model: InstituteBatch, as: 'batch', attributes: ['id', 'name'] }],
  toDto: (row) => ({ ...row.toJSON(), batchName: row.batch?.name || null }),
  beforeCreate: async (req) => ({ ...req.body, careerId: generateCareerId() }),
});

// ── Assessments ──────────────────────────────────────────────────
const assessments = makeCrud(InstituteAssessment, {
  include: [{ model: InstituteCourse, as: 'course', attributes: ['id', 'title'] }],
  toDto: (row) => ({ ...row.toJSON(), courseName: row.course?.title || null }),
});

// ── Assignments ──────────────────────────────────────────────────
const assignments = makeCrud(InstituteAssignment, {
  include: [{ model: InstituteCourse, as: 'course', attributes: ['id', 'title'] }],
  toDto: (row) => ({ ...row.toJSON(), courseName: row.course?.title || null }),
});

// ── Certificates ─────────────────────────────────────────────────
function generateCertificateNo() {
  const year = new Date().getFullYear();
  return `HX-CERT-${year}-${String(Date.now()).slice(-6)}`;
}

const certificates = makeCrud(InstituteCertificate, {
  include: [{ model: InstituteStudent, as: 'student', attributes: ['id', 'name', 'careerId'] }],
  toDto: (row) => ({ ...row.toJSON(), studentName: row.student?.name || null }),
  beforeCreate: async (req) => ({ ...req.body, certificateNo: generateCertificateNo() }),
});

// ── Dashboard summary ────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const institutionId = req.institutionId;
  const [studentRows, batchRows, courseCount, certificateCount] = await Promise.all([
    InstituteStudent.findAll({ where: { institutionId }, attributes: ['attendance', 'progress', 'internshipEligible'] }),
    InstituteBatch.findAll({ where: { institutionId }, attributes: ['status'] }),
    InstituteCourse.count({ where: { institutionId } }),
    InstituteCertificate.count({ where: { institutionId } }),
  ]);

  const studentCount = studentRows.length;
  const avgAttendance = studentCount
    ? Math.round(studentRows.reduce((sum, s) => sum + s.attendance, 0) / studentCount)
    : 0;
  const avgProgress = studentCount
    ? Math.round(studentRows.reduce((sum, s) => sum + s.progress, 0) / studentCount)
    : 0;
  const eligibleCount = studentRows.filter((s) => s.internshipEligible).length;
  const activeBatches = batchRows.filter((b) => b.status === 'active').length;

  res.json({
    success: true,
    data: {
      instituteName: req.institution?.instituteName,
      totals: {
        students: studentCount,
        batches: batchRows.length,
        activeBatches,
        courses: courseCount,
        certificates: certificateCount,
        internshipEligible: eligibleCount,
      },
      avgAttendance,
      avgProgress,
    },
  });
});

module.exports = { courses, batches, students, assessments, assignments, certificates, getDashboard };
