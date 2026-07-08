/**
 * controllers/institutionController.js
 * All Institution Portal logic
 */
const asyncHandler = require('express-async-handler');
const { Op }       = require('sequelize');
const { sequelize } = require('../config/db');
const {
  User, Institution, InstitutionStudent,
  Batch, BatchStudent, Course, CourseStudent, InstitutionCertificate,
} = require('../models');
const QRCode  = require('qrcode');
const PDFDocument = require('pdfkit');

// ── Helpers ──────────────────────────────────────────────────────

async function generateCareerId() {
  const year = new Date().getFullYear();
  const last = await InstitutionStudent.findOne({
    where: { careerId: { [Op.like]: `HX-${year}-%` } },
    order: [['createdAt', 'DESC']],
  });
  let seq = 1;
  if (last?.careerId) {
    const parts = last.careerId.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  return `HX-${year}-${String(seq).padStart(6, '0')}`;
}

function getInstitutionId(req) {
  return req.institutionId; // set by middleware
}

// ── Profile ───────────────────────────────────────────────────────

const getProfile = asyncHandler(async (req, res) => {
  const inst = await Institution.findOne({
    where: { userId: req.user.id },
    include: [{ model: User, as: 'user', attributes: ['name','email','isApproved','createdAt'] }],
  });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  res.json({ success: true, data: inst });
});

const updateProfile = asyncHandler(async (req, res) => {
  const inst = await Institution.findOne({ where: { userId: req.user.id } });
  if (!inst) { res.status(404); throw new Error('Institution not found'); }
  const allowed = ['institutionName','type','affiliatedTo','address','city','state','pincode',
                   'website','phone','description','contactName','contactEmail','contactPhone'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await inst.update(updates);
  res.json({ success: true, data: inst });
});

// ── Students ──────────────────────────────────────────────────────

const getStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { search, page = 1, limit = 20 } = req.query;
  const where = { institutionId };
  if (search) {
    where[Op.or] = [
      { name:    { [Op.iLike]: `%${search}%` } },
      { email:   { [Op.iLike]: `%${search}%` } },
      { mobile:  { [Op.iLike]: `%${search}%` } },
      { careerId:{ [Op.iLike]: `%${search}%` } },
    ];
  }
  const { count, rows } = await InstitutionStudent.findAndCountAll({
    where, order: [['createdAt','DESC']],
    limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const createStudent = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { name, email, mobile, dob, gender, address, department, rollNumber, year, skills } = req.body;
  if (!name || !email) { res.status(400); throw new Error('Name and email are required'); }

  const exists = await InstitutionStudent.findOne({ where: { institutionId, email } });
  if (exists) { res.status(400); throw new Error('Student with this email already exists in your institution'); }

  const careerId = await generateCareerId();
  const student = await InstitutionStudent.create({
    institutionId, careerId, name, email, mobile, dob, gender,
    address, department, rollNumber, year,
    skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : [],
  });
  res.status(201).json({ success: true, data: student });
});

const updateStudent = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const student = await InstitutionStudent.findOne({ where: { id: req.params.id, institutionId } });
  if (!student) { res.status(404); throw new Error('Student not found'); }
  const allowed = ['name','mobile','dob','gender','address','department','rollNumber','year','skills','isInternshipEligible'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await student.update(updates);
  res.json({ success: true, data: student });
});

const deleteStudent = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const student = await InstitutionStudent.findOne({ where: { id: req.params.id, institutionId } });
  if (!student) { res.status(404); throw new Error('Student not found'); }
  await student.destroy();
  res.json({ success: true, message: 'Student deleted' });
});

const getStudent = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const student = await InstitutionStudent.findOne({
    where: { id: req.params.id, institutionId },
    include: [
      { model: Batch,   as: 'batches',  through: { attributes: [] } },
      { model: Course,  as: 'courses',  through: { attributes: ['status','enrolledAt'] } },
      { model: InstitutionCertificate, as: 'certificates' },
    ],
  });
  if (!student) { res.status(404); throw new Error('Student not found'); }
  res.json({ success: true, data: student });
});

const bulkImportStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { students } = req.body; // Array of student objects
  if (!Array.isArray(students) || students.length === 0) {
    res.status(400); throw new Error('No students provided');
  }
  const results = { created: 0, skipped: 0, errors: [] };
  for (const s of students) {
    try {
      if (!s.name || !s.email) { results.errors.push({ row: s, reason: 'Name/email missing' }); continue; }
      const exists = await InstitutionStudent.findOne({ where: { institutionId, email: s.email.trim().toLowerCase() } });
      if (exists) { results.skipped++; continue; }
      const careerId = await generateCareerId();
      await InstitutionStudent.create({ ...s, email: s.email.trim().toLowerCase(), institutionId, careerId });
      results.created++;
    } catch(e) { results.errors.push({ row: s, reason: e.message }); }
  }
  res.json({ success: true, data: results });
});

// ── Batches ───────────────────────────────────────────────────────

const getBatches = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batches = await Batch.findAll({
    where: { institutionId },
    order: [['createdAt','DESC']],
  });
  // Add student count
  const batchesWithCount = await Promise.all(batches.map(async (b) => {
    const count = await BatchStudent.count({ where: { batchId: b.id } });
    return { ...b.toJSON(), studentCount: count };
  }));
  res.json({ success: true, data: batchesWithCount });
});

const createBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { name, description, startDate, endDate, trainerName, trainerEmail, status } = req.body;
  if (!name) { res.status(400); throw new Error('Batch name is required'); }
  const batch = await Batch.create({ institutionId, name, description, startDate, endDate, trainerName, trainerEmail, status });
  res.status(201).json({ success: true, data: batch });
});

const updateBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batch = await Batch.findOne({ where: { id: req.params.id, institutionId } });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }
  const allowed = ['name','description','startDate','endDate','trainerName','trainerEmail','status'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await batch.update(updates);
  res.json({ success: true, data: batch });
});

const deleteBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batch = await Batch.findOne({ where: { id: req.params.id, institutionId } });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }
  await batch.destroy();
  res.json({ success: true, message: 'Batch deleted' });
});

const getBatchStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batch = await Batch.findOne({ where: { id: req.params.id, institutionId } });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }
  const students = await InstitutionStudent.findAll({
    include: [{ model: Batch, as: 'batches', where: { id: req.params.id }, through: { attributes: [] } }],
  });
  res.json({ success: true, data: students, batch });
});

const assignStudentsToBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { studentIds } = req.body;
  const batch = await Batch.findOne({ where: { id: req.params.id, institutionId } });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }
  for (const sid of studentIds) {
    const st = await InstitutionStudent.findOne({ where: { id: sid, institutionId } });
    if (st) {
      await BatchStudent.findOrCreate({ where: { batchId: batch.id, studentId: sid } });
    }
  }
  res.json({ success: true, message: 'Students assigned to batch' });
});

const removeStudentFromBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batch = await Batch.findOne({ where: { id: req.params.id, institutionId } });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }
  await BatchStudent.destroy({ where: { batchId: batch.id, studentId: req.params.studentId } });
  res.json({ success: true, message: 'Student removed from batch' });
});

// ── Courses ───────────────────────────────────────────────────────

const getCourses = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const courses = await Course.findAll({ where: { institutionId }, order: [['createdAt','DESC']] });
  res.json({ success: true, data: courses });
});

const createCourse = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { name, description, duration, durationUnit, status } = req.body;
  if (!name) { res.status(400); throw new Error('Course name is required'); }
  const course = await Course.create({ institutionId, name, description, duration, durationUnit, status });
  res.status(201).json({ success: true, data: course });
});

const updateCourse = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const course = await Course.findOne({ where: { id: req.params.id, institutionId } });
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const allowed = ['name','description','duration','durationUnit','status'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await course.update(updates);
  res.json({ success: true, data: course });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const course = await Course.findOne({ where: { id: req.params.id, institutionId } });
  if (!course) { res.status(404); throw new Error('Course not found'); }
  await course.destroy();
  res.json({ success: true, message: 'Course deleted' });
});

const assignStudentsToCourse = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { studentIds } = req.body;
  const course = await Course.findOne({ where: { id: req.params.id, institutionId } });
  if (!course) { res.status(404); throw new Error('Course not found'); }
  for (const sid of studentIds) {
    const st = await InstitutionStudent.findOne({ where: { id: sid, institutionId } });
    if (st) await CourseStudent.findOrCreate({ where: { courseId: course.id, studentId: sid } });
  }
  res.json({ success: true, message: 'Students assigned to course' });
});

// ── Certificates ──────────────────────────────────────────────────

const getCertificates = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { page = 1, limit = 20 } = req.query;
  const { count, rows } = await InstitutionCertificate.findAndCountAll({
    where: { institutionId },
    include: [
      { model: InstitutionStudent, as: 'student', attributes: ['name','email','careerId'] },
      { model: Course,             as: 'course',  attributes: ['name'] },
    ],
    order: [['issuedAt','DESC']],
    limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const issueCertificate = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const inst = await Institution.findOne({ where: { userId: req.user.id } });
  const { studentId, courseId, type } = req.body;
  if (!studentId || !type) { res.status(400); throw new Error('studentId and type are required'); }

  const student = await InstitutionStudent.findOne({ where: { id: studentId, institutionId } });
  if (!student) { res.status(404); throw new Error('Student not found'); }

  let courseName = null;
  if (courseId) {
    const course = await Course.findOne({ where: { id: courseId, institutionId } });
    if (course) courseName = course.name;
  }

  const cert = await InstitutionCertificate.create({
    institutionId, studentId, courseId: courseId || null, type,
    studentName: student.name,
    courseName,
    institutionName: inst.institutionName,
  });
  res.status(201).json({ success: true, data: cert });
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const cert = await InstitutionCertificate.findOne({
    where: { certificateId: req.params.certId },
    include: [
      { model: InstitutionStudent, as: 'student', attributes: ['name','email','careerId','department'] },
      { model: Institution,        as: 'institution', attributes: ['institutionName','city','state'] },
    ],
  });
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }
  res.json({ success: true, valid: cert.isValid, data: cert });
});

const downloadCertificatePDF = asyncHandler(async (req, res) => {
  const cert = await InstitutionCertificate.findOne({
    where: { certificateId: req.params.certId },
    include: [{ model: Institution, as: 'institution', attributes: ['institutionName','city','state'] }],
  });
  if (!cert) { res.status(404); throw new Error('Certificate not found'); }

  const verifyUrl = `${process.env.CLIENT_URL || 'https://hiresnix.co.in'}/verify/${cert.certificateId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
  const qrBuffer  = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${cert.certificateId}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
  doc.pipe(res);

  // Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fafafa');
  doc.rect(20, 20, doc.page.width-40, doc.page.height-40).lineWidth(3).stroke('#4f46e5');
  doc.rect(26, 26, doc.page.width-52, doc.page.height-52).lineWidth(1).stroke('#818cf8');

  // Header
  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(28)
     .text('HIRESNIX', 0, 55, { align: 'center' });
  doc.fillColor('#4f46e5').font('Helvetica').fontSize(11)
     .text('Empowering Careers | Partner Institution Certificate', 0, 90, { align: 'center' });

  doc.moveTo(40, 115).lineTo(doc.page.width-40, 115).stroke('#c7d2fe');

  // Title
  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(22)
     .text('CERTIFICATE OF ' + cert.type.toUpperCase(), 0, 135, { align: 'center' });

  doc.fillColor('#6b7280').font('Helvetica').fontSize(13)
     .text('This is to certify that', 0, 172, { align: 'center' });

  // Student name
  doc.fillColor('#1e1b4b').font('Helvetica-Bold').fontSize(26)
     .text(cert.studentName, 0, 195, { align: 'center' });

  // Body text
  const bodyY = 235;
  const courseText = cert.courseName ? ` in ${cert.courseName}` : '';
  doc.fillColor('#374151').font('Helvetica').fontSize(13)
     .text(`has successfully completed the ${cert.type}${courseText}`, 0, bodyY, { align: 'center' });

  doc.fillColor('#6b7280').fontSize(12)
     .text(`at ${cert.institutionName}`, 0, bodyY+22, { align: 'center' });

  doc.fillColor('#6b7280').fontSize(11)
     .text(`Issued on: ${new Date(cert.issuedAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}`,
           0, bodyY+48, { align: 'center' });

  // Certificate ID
  doc.fillColor('#4f46e5').font('Helvetica-Bold').fontSize(10)
     .text(`Certificate ID: ${cert.certificateId}`, 0, bodyY+72, { align: 'center' });

  // QR Code
  const qrX = doc.page.width - 140;
  const qrY = doc.page.height - 140;
  doc.image(qrBuffer, qrX, qrY, { width: 90, height: 90 });
  doc.fillColor('#6b7280').font('Helvetica').fontSize(8)
     .text('Scan to verify', qrX, qrY+92, { width: 90, align: 'center' });

  // Footer line
  doc.moveTo(40, doc.page.height-55).lineTo(doc.page.width-40, doc.page.height-55).stroke('#c7d2fe');
  doc.fillColor('#6b7280').fontSize(9)
     .text('This certificate is digitally generated and can be verified at hiresnix.co.in/verify', 0, doc.page.height-45, { align: 'center' });

  doc.end();
});

// ── Dashboard Stats ───────────────────────────────────────────────

const getDashboardStats = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const [totalStudents, totalBatches, totalCourses, totalCertificates] = await Promise.all([
    InstitutionStudent.count({ where: { institutionId } }),
    Batch.count({ where: { institutionId } }),
    Course.count({ where: { institutionId } }),
    InstitutionCertificate.count({ where: { institutionId } }),
  ]);
  const recentStudents = await InstitutionStudent.findAll({
    where: { institutionId }, order: [['createdAt','DESC']], limit: 5,
  });
  const batches = await Batch.findAll({
    where: { institutionId }, order: [['createdAt','DESC']], limit: 5,
  });
  const batchesWithCount = await Promise.all(batches.map(async b => {
    const count = await BatchStudent.count({ where: { batchId: b.id } });
    return { ...b.toJSON(), studentCount: count };
  }));
  res.json({ success: true, data: { totalStudents, totalBatches, totalCourses, totalCertificates, recentStudents, recentBatches: batchesWithCount } });
});

module.exports = {
  getProfile, updateProfile,
  getStudents, createStudent, updateStudent, deleteStudent, getStudent, bulkImportStudents,
  getBatches, createBatch, updateBatch, deleteBatch, getBatchStudents, assignStudentsToBatch, removeStudentFromBatch,
  getCourses, createCourse, updateCourse, deleteCourse, assignStudentsToCourse,
  getCertificates, issueCertificate, verifyCertificate, downloadCertificatePDF,
  getDashboardStats,
};
