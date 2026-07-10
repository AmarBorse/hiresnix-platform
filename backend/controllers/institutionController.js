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
const QRCode      = require('qrcode');
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

// Default password: HX@ + last 6 of careerId  e.g. HX@000001
function defaultPassword(careerId) {
  return `HX@${careerId.split('-')[2]}`;
}

function getInstitutionId(req) { return req.institutionId; }

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
    where, attributes: { exclude: ['password'] },
    order: [['createdAt','DESC']],
    limit: parseInt(limit), offset: (parseInt(page)-1)*parseInt(limit),
  });
  res.json({ success: true, total: count, data: rows });
});

const createStudent = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { name, email, mobile, dob, gender, address, department, rollNumber, year, skills } = req.body;
  if (!name || !email) { res.status(400); throw new Error('Name and email are required'); }

  const exists = await InstitutionStudent.findOne({ where: { institutionId, email } });
  if (exists) { res.status(400); throw new Error('Student with this email already exists'); }

  const careerId = await generateCareerId();
  const pwd      = defaultPassword(careerId);  // plain text for response only

  const student = await InstitutionStudent.create({
    institutionId, careerId,
    password: pwd,   // will be hashed by beforeCreate hook
    name, email, mobile, dob, gender, address, department, rollNumber, year,
    skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())) : [],
  });

  // Return plain password once (so admin can note it)
  res.status(201).json({
    success: true,
    data: { ...student.toJSON(), password: undefined, defaultPassword: pwd },
  });
});

const updateStudent = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const student = await InstitutionStudent.findOne({ where: { id: req.params.id, institutionId } });
  if (!student) { res.status(404); throw new Error('Student not found'); }
  const allowed = ['name','mobile','dob','gender','address','department','rollNumber','year','skills','isInternshipEligible'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  await student.update(updates);
  res.json({ success: true, data: { ...student.toJSON(), password: undefined } });
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
    attributes: { exclude: ['password'] },
    include: [
      { model: Batch,  as: 'batches',  through: { attributes: [] } },
      { model: Course, as: 'courses',  through: { attributes: ['status','enrolledAt'] } },
      { model: InstitutionCertificate, as: 'certificates' },
    ],
  });
  if (!student) { res.status(404); throw new Error('Student not found'); }
  res.json({ success: true, data: student });
});

const bulkImportStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { students } = req.body;
  if (!Array.isArray(students) || students.length === 0) { res.status(400); throw new Error('No students provided'); }
  const results = { created: 0, skipped: 0, errors: [], credentials: [] };
  for (const s of students) {
    try {
      if (!s.name || !s.email) { results.errors.push({ row: s, reason: 'Name/email missing' }); continue; }
      const exists = await InstitutionStudent.findOne({ where: { institutionId, email: s.email.trim().toLowerCase() } });
      if (exists) { results.skipped++; continue; }
      const careerId = await generateCareerId();
      const pwd      = defaultPassword(careerId);
      await InstitutionStudent.create({ ...s, email: s.email.trim().toLowerCase(), institutionId, careerId, password: pwd });
      results.created++;
      results.credentials.push({ name: s.name, careerId, defaultPassword: pwd });
    } catch(e) { results.errors.push({ row: s, reason: e.message }); }
  }
  res.json({ success: true, data: results });
});

// GET /api/institution/students/credentials — download credentials as JSON (frontend converts to Excel)
const getStudentCredentials = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const students = await InstitutionStudent.findAll({
    where: { institutionId },
    attributes: ['careerId','name','email','mobile','department','rollNumber'],
    order: [['createdAt','ASC']],
  });
  // Return with default passwords (derived from careerId)
  const data = students.map(s => ({
    'Career ID':        s.careerId,
    'Name':             s.name,
    'Email':            s.email,
    'Mobile':           s.mobile || '',
    'Department':       s.department || '',
    'Roll Number':      s.rollNumber || '',
    'Default Password': defaultPassword(s.careerId),
    'Login URL':        `${process.env.CLIENT_URL || 'https://hiresnix.co.in'}/inst-login`,
  }));
  res.json({ success: true, data });
});

// ── Batches ───────────────────────────────────────────────────────

const getBatches = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batches = await Batch.findAll({ where: { institutionId }, order: [['createdAt','DESC']] });
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
    attributes: { exclude: ['password'] },
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
    if (st) await BatchStudent.findOrCreate({ where: { batchId: batch.id, studentId: sid } });
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
    studentName: student.name, courseName,
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

  const W = 841.89; // A4 landscape width
  const H = 595.28; // A4 landscape height
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  // ── WHITE Background ─────────────────────────────────────────
  doc.rect(0, 0, W, H).fill('#ffffff');

  // ── DARK Header Bar ───────────────────────────────────────────
  const headerH = 80;
  doc.rect(0, 0, W, headerH).fill('#0f172a');

  // Gold diamond left in header
  const drawDiamond = (x, y, size) => {
    doc.save();
    doc.translate(x, y).rotate(45);
    doc.rect(-size/2, -size/2, size, size).fill('#c9973a');
    doc.restore();
  };
  drawDiamond(50, headerH/2, 12);
  drawDiamond(W - 50, headerH/2, 12);

  // Hiresnix logo text in header
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(22)
     .text('Hiresnix', 68, 22, { continued: false });
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(9)
     .text('Empowering Future Professionals', 70, 48);

  // "CERTIFICATE OF COMPLETION" right side
  doc.fillColor('#60a5fa').font('Helvetica-Bold').fontSize(11)
     .text(cert.type.toUpperCase(), 0, 35, { align: 'right', width: W - 60 });

  const footerH = 35;

  // ── Gold side borders ─────────────────────────────────────────
  doc.rect(18, headerH + 10, 3, H - headerH - footerH - 20).fill('#c9973a');
  doc.rect(W - 21, headerH + 10, 3, H - headerH - footerH - 20).fill('#c9973a');

  // ── Main Content ──────────────────────────────────────────────
  const contentTop = headerH + 35;

  // "Certificate of Completion" big title
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(38)
     .text('Certificate of Completion', 0, contentTop, { align: 'center' });

  // Gold divider line
  doc.moveTo(W*0.35, contentTop + 50).lineTo(W*0.65, contentTop + 50)
     .lineWidth(1.5).stroke('#c9973a');

  // "This is to certify that"
  doc.fillColor('#475569').font('Helvetica').fontSize(13)
     .text('This is to certify that', 0, contentTop + 65, { align: 'center' });

  // Student Name
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(32)
     .text(cert.studentName, 0, contentTop + 88, { align: 'center' });

  // "has successfully completed..."
  doc.fillColor('#475569').font('Helvetica').fontSize(13)
     .text('has successfully completed the Skill Assessment in', 0, contentTop + 132, { align: 'center' });

  // Course name — blue bold
  const certTitle = cert.courseName || cert.type;
  doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(22)
     .text(certTitle, 0, contentTop + 155, { align: 'center' });

  // Institution + date
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(12)
     .text(`at ${cert.institutionName}  |  Issued on ${issuedDate}`, 0, contentTop + 195, { align: 'center' });

  // Certificate ID
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(10)
     .text(`Certificate No: ${cert.certificateId}`, 0, contentTop + 218, { align: 'center' });

  // ── Signatures ────────────────────────────────────────────────
  const sigY = H - footerH - 100;
  const sig1X = W * 0.18;
  const sig2X = W * 0.62;
  const sigW  = W * 0.22;

  // Signature lines
  doc.moveTo(sig1X, sigY + 40).lineTo(sig1X + sigW, sigY + 40).lineWidth(1).stroke('#94a3b8');
  doc.moveTo(sig2X, sigY + 40).lineTo(sig2X + sigW, sigY + 40).lineWidth(1).stroke('#94a3b8');

  // Signature names
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11)
     .text('Mr.Jayesh Badgujar', sig1X, sigY + 45, { width: sigW, align: 'center' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(9)
     .text('Program Director', sig1X, sigY + 60, { width: sigW, align: 'center' });

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11)
     .text('Mr.A S Borse', sig2X, sigY + 45, { width: sigW, align: 'center' });
  doc.fillColor('#64748b').font('Helvetica').fontSize(9)
     .text('Founder & CEO, Hiresnix', sig2X, sigY + 60, { width: sigW, align: 'center' });

  // ── QR Code (center bottom) ───────────────────────────────────
  const qrSize = 75;
  const qrX = W/2 - qrSize/2;
  const qrY2 = sigY + 5;
  doc.rect(qrX - 6, qrY2 - 6, qrSize + 12, qrSize + 22).lineWidth(1).stroke('#c9973a');
  doc.image(qrBuffer, qrX, qrY2, { width: qrSize, height: qrSize });
  doc.fillColor('#64748b').font('Helvetica').fontSize(8)
     .text('Scan to Verify', qrX - 6, qrY2 + qrSize + 4, { width: qrSize + 12, align: 'center' });
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
     .text(cert.certificateId, qrX - 6, qrY2 + qrSize + 14, { width: qrSize + 12, align: 'center' });

  // ── DARK Footer Bar ───────────────────────────────────────────
  doc.rect(0, H - footerH, W, footerH).fill('#0f172a');
  doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
     .text(`support@hiresnix.co.in  |  www.hiresnix.co.in  |  Pune, Maharashtra, India`, 0, H - footerH + 13, { align: 'center' });

  // ── Bottom footer line ────────────────────────────────────────
  doc.fillColor('#334155').font('Helvetica').fontSize(7)
     .text('This certificate is digitally generated and can be verified at hiresnix.co.in/verify', 0, H-28, { align: 'center' });

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
    where: { institutionId }, attributes: { exclude: ['password'] },
    order: [['createdAt','DESC']], limit: 5,
  });
  const batches = await Batch.findAll({ where: { institutionId }, order: [['createdAt','DESC']], limit: 5 });
  const batchesWithCount = await Promise.all(batches.map(async b => {
    const count = await BatchStudent.count({ where: { batchId: b.id } });
    return { ...b.toJSON(), studentCount: count };
  }));
  res.json({ success: true, data: { totalStudents, totalBatches, totalCourses, totalCertificates, recentStudents, recentBatches: batchesWithCount } });
});

module.exports = {
  getProfile, updateProfile,
  getStudents, createStudent, updateStudent, deleteStudent, getStudent,
  bulkImportStudents, getStudentCredentials,
  getBatches, createBatch, updateBatch, deleteBatch, getBatchStudents,
  assignStudentsToBatch, removeStudentFromBatch,
  getCourses, createCourse, updateCourse, deleteCourse, assignStudentsToCourse,
  getCertificates, issueCertificate, verifyCertificate, downloadCertificatePDF,
  getDashboardStats,
};