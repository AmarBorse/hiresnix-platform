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
const XLSX = require('xlsx');
const path = require('path');
const fs_cert = require('fs');

const getInstSigPath = (filename) => path.join(__dirname, '..', 'signatures', filename);

function signatureLine(doc, name, title, x, y, imagePath = null, sizeMultiplier = 1) {
  if (imagePath) {
    try {
      if (fs_cert.existsSync(imagePath)) {
        const boxW = 100 * sizeMultiplier;
        const boxH = 40 * sizeMultiplier;
        const xOffset = (160 - boxW) / 2;
        const yOffset = boxH - 12;
        doc.image(imagePath, x + xOffset, y - yOffset, { fit: [boxW, boxH], align: 'center' });
      }
    } catch(err) { console.error('Sig error:', err.message); }
  }
  doc.moveTo(x, y).lineTo(x + 160, y).stroke('#334155');
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(name, x, y+6, { width: 160, align: 'center' });
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(title, x, y+20, { width: 160, align: 'center' });
}

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

// bulkImportStudents moved to CSV/Excel version below

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
  const batches = await Batch.findAll({
    where: { institutionId },
    include: [{ model: Course, as: 'course', attributes: ['id','name','duration','durationUnit'] }],
    order: [['createdAt','DESC']],
  });
  const batchesWithCount = await Promise.all(batches.map(async (b) => {
    const count = await BatchStudent.count({ where: { batchId: b.id } });
    return { ...b.toJSON(), studentCount: count };
  }));
  res.json({ success: true, data: batchesWithCount });
});

const createBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { name, description, startDate, endDate, trainerName, trainerEmail, status, courseId } = req.body;
  if (!name) { res.status(400); throw new Error('Batch name is required'); }
  const batch = await Batch.create({ institutionId, name, description, startDate, endDate, trainerName, trainerEmail, status, courseId: courseId || null });
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

  // Get students with their course info via BatchStudent
  const batchStudents = await BatchStudent.findAll({
    where: { batchId: batch.id },
    include: [
      { model: InstitutionStudent, as: 'student', attributes: { exclude: ['password'] } },
    ],
  });

  const students = batchStudents.map(bs => bs.student?.toJSON()).filter(Boolean);

  res.json({ success: true, data: students, batch });
});

const assignStudentsToBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { studentIds, courseId } = req.body;
  const batch = await Batch.findOne({ where: { id: req.params.id, institutionId } });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }

  // Validate course belongs to this institution
  let validCourse = null;
  if (courseId) {
    validCourse = await Course.findOne({ where: { id: courseId, institutionId } });
  }

  for (const sid of studentIds) {
    const st = await InstitutionStudent.findOne({ where: { id: sid, institutionId } });
    if (st) {
      const [bs, created] = await BatchStudent.findOrCreate({
        where: { batchId: batch.id, studentId: sid },
        defaults: { courseId: validCourse?.id || null },
      });
      // Update courseId if already exists and courseId provided
      if (!created && validCourse && !bs.courseId) {
        await bs.update({ courseId: validCourse.id });
      }
    }
  }
  res.json({ success: true, message: 'Students assigned to batch' });
});

// Returns students NOT already assigned to a batch with the same course
const getAvailableStudentsForBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const batch = await Batch.findOne({
    where: { id: req.params.id, institutionId },
    include: [{ model: Course, as: 'course' }],
  });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }

  // All students in this institution
  const allStudents = await InstitutionStudent.findAll({
    where: { institutionId },
    attributes: { exclude: ['password'] },
  });

  // Students already in THIS batch
  const inThisBatch = await BatchStudent.findAll({ where: { batchId: batch.id } });
  const inThisBatchIds = new Set(inThisBatch.map(bs => bs.studentId));

  // If batch has a course, find students who:
  // 1. Already in another batch with same course
  // 2. Already have a certificate for this course
  let sameCourseStudentIds = new Set();
  if (batch.courseId) {
    // Find all other batches with same course
    const sameCoursBatches = await Batch.findAll({
      where: { institutionId, courseId: batch.courseId, id: { [Op.ne]: batch.id } },
    });
    if (sameCoursBatches.length > 0) {
      const sameBatchIds = sameCoursBatches.map(b => b.id);
      const enrolled = await BatchStudent.findAll({
        where: { batchId: { [Op.in]: sameBatchIds } },
      });
      enrolled.forEach(e => sameCourseStudentIds.add(e.studentId));
    }

    // Also block students who already have a certificate for this course
    const certifiedStudents = await InstitutionCertificate.findAll({
      where: { institutionId, courseId: batch.courseId },
      attributes: ['studentId'],
    });
    certifiedStudents.forEach(c => sameCourseStudentIds.add(c.studentId));
  }

  const available  = allStudents.filter(s => !inThisBatchIds.has(s.id) && !sameCourseStudentIds.has(s.id));
  const alreadyIn  = allStudents.filter(s => inThisBatchIds.has(s.id));
  const sameCourseDuplicate = allStudents.filter(s => !inThisBatchIds.has(s.id) && sameCourseStudentIds.has(s.id));

  res.json({
    success: true,
    data: available,
    alreadyInBatch: alreadyIn,
    alreadyInSameCourse: sameCourseDuplicate,
    batchCourse: batch.course || null,
  });
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

const getCourseStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const course = await Course.findOne({ where: { id: req.params.id, institutionId } });
  if (!course) { res.status(404); throw new Error('Course not found'); }
  const enrolled = await CourseStudent.findAll({
    where: { courseId: course.id },
    include: [{ model: InstitutionStudent, as: 'student', attributes: { exclude: ['password'] } }],
  });
  const students = enrolled.map(e => e.student?.toJSON()).filter(Boolean);
  res.json({ success: true, data: students });
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
  const { studentId, courseId, batchId, type } = req.body;
  if (!studentId || !type) { res.status(400); throw new Error('studentId and type are required'); }
  const student = await InstitutionStudent.findOne({ where: { id: studentId, institutionId } });
  if (!student) { res.status(404); throw new Error('Student not found'); }

  // Resolve courseId from batch if not provided directly
  let resolvedCourseId = courseId || null;
  let courseName = null;

  if (batchId && !resolvedCourseId) {
    const batch = await Batch.findOne({
      where: { id: batchId, institutionId },
      include: [{ model: Course, as: 'course' }],
    });
    if (batch?.course) {
      resolvedCourseId = batch.course.id;
      courseName = batch.course.name;
    }
  }

  if (!courseName && resolvedCourseId) {
    const course = await Course.findOne({ where: { id: resolvedCourseId, institutionId } });
    if (course) courseName = course.name;
  }

  // Skip if already issued same type + course
  const alreadyIssued = await InstitutionCertificate.findOne({
    where: { institutionId, studentId, type, courseId: resolvedCourseId || null },
  });
  if (alreadyIssued) {
    return res.status(200).json({ success: true, skipped: true, message: 'Certificate already issued', data: alreadyIssued });
  }

  const cert = await InstitutionCertificate.create({
    institutionId, studentId, courseId: resolvedCourseId || null, type,
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

  const W = 841.89;
  const H = 595.28;
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  doc.pipe(res);

  const COMPANY = {
    name: 'Hiresnix',
    tagline: 'Empowering Future Professionals',
    email: 'support@hiresnix.co.in',
    website: 'www.hiresnix.co.in',
    address: 'Pune, Maharashtra, India',
    colors: {
      accent:    '#d4af37',
      primary:   '#1e40af',
      highlight: '#60a5fa',
    }
  };

  // ── Gold border ───────────────────────────────────────────────
  doc.rect(20, 20, W-40, H-40).lineWidth(3).stroke(COMPANY.colors.accent);
  doc.rect(26, 26, W-52, H-52).lineWidth(1).stroke(COMPANY.colors.accent);

  // ── Dark Header ───────────────────────────────────────────────
  doc.rect(20, 20, W-40, 90).fill('#0f172a');

  // Company name
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
     .text(COMPANY.name, 50, 35);
  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
     .text(COMPANY.tagline, 50, 62);

  // Certificate type top right
  const certTypeHeader = cert.type === 'Skill Assessment'
    ? 'CERTIFICATE OF SKILL ASSESSMENT'
    : cert.type === 'Course Completion'
    ? 'CERTIFICATE OF COURSE COMPLETION'
    : `CERTIFICATE OF ${cert.type.toUpperCase()}`;
  doc.fillColor(COMPANY.colors.highlight).fontSize(11).font('Helvetica-Bold')
     .text(certTypeHeader, 0, 52, { align: 'right', width: W-50 });

  // Gold diamonds
  const drawDiamond = (x, y, size) => {
    doc.moveTo(x, y-size).lineTo(x+size, y).lineTo(x, y+size).lineTo(x-size, y)
       .fillColor(COMPANY.colors.accent).fill();
  };
  drawDiamond(35, 70, 6);
  drawDiamond(W-35, 70, 6);

  // ── Title ─────────────────────────────────────────────────────
  const titleText = cert.type === 'Skill Assessment'
    ? 'Certificate of Skill Assessment'
    : cert.type === 'Course Completion'
    ? 'Certificate of Course Completion'
    : `Certificate of ${cert.type}`;

  doc.fillColor('#0f172a').fontSize(32).font('Helvetica-Bold')
     .text(titleText, 0, 135, { align: 'center' });

  // Gold divider
  doc.rect(W/2-100, 180, 200, 2).fill(COMPANY.colors.accent);

  // ── Body ──────────────────────────────────────────────────────
  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text('This is to certify that', 0, 200, { align: 'center' });

  doc.fillColor('#0f172a').fontSize(28).font('Helvetica-Bold')
     .text(cert.studentName, 0, 222, { align: 'center' });

  const bodyText = cert.courseName
    ? `has successfully completed the ${cert.type} in ${cert.courseName}`
    : `has successfully completed the ${cert.type}`;

  doc.fillColor('#475569').fontSize(13).font('Helvetica')
     .text(bodyText, 0, 268, { align: 'center' });

  doc.fillColor(COMPANY.colors.primary).fontSize(16).font('Helvetica-Bold')
     .text(`at ${cert.institutionName || COMPANY.name}`, 0, 293, { align: 'center' });

  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.fillColor('#475569').fontSize(12).font('Helvetica')
     .text(`Issued on ${issuedDate}`, 0, 320, { align: 'center' });

  doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
     .text(`Certificate No: ${cert.certificateId}`, 0, 342, { align: 'center' });

  // ── QR Code ───────────────────────────────────────────────────
  const qrSize = 75;
  const qrX = W/2 - qrSize/2;
  const qrY = H - 168;
  doc.roundedRect(qrX-9, qrY-9, qrSize+18, qrSize+34, 6)
     .fillAndStroke('#ffffff', COMPANY.colors.accent);
  doc.image(qrBuffer, qrX, qrY, { width: qrSize });
  doc.fillColor('#1e293b').fontSize(7).font('Helvetica-Bold')
     .text('Scan to Verify', qrX, qrY+qrSize+4, { width: qrSize, align: 'center' });
  doc.fillColor('#64748b').fontSize(5.5).font('Helvetica')
     .text(cert.certificateId, qrX-4, qrY+qrSize+15, { width: qrSize+8, align: 'center' });

  // ── Signatures with images ────────────────────────────────────
  const sigY = H - 130;
  const sig1X = W/2 - 270;
  const sig2X = W/2 + 110;
  const sigW  = 150;
  const sigImgH = 58;

  // Director signature
  try {
    const dirSigPath = path.join(__dirname, '..', 'signatures', 'Director.png');
    if (require('fs').existsSync(dirSigPath)) {
      doc.image(dirSigPath, sig1X + 20, sigY - sigImgH - 2, { height: sigImgH, fit: [sigW - 20, sigImgH] });
    }
  } catch(e) {}
  doc.moveTo(sig1X, sigY+2).lineTo(sig1X+sigW, sigY+2).lineWidth(0.8).stroke('#94a3b8');
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
     .text('Mr.Jayesh Badgujar', sig1X, sigY+7, { width: sigW, align: 'center' });
  doc.fillColor('#64748b').fontSize(8).font('Helvetica')
     .text('Program Director', sig1X, sigY+21, { width: sigW, align: 'center' });

  // CEO signature
  try {
    const ceoSigPath = path.join(__dirname, '..', 'signatures', 'ceo.png');
    if (require('fs').existsSync(ceoSigPath)) {
      doc.image(ceoSigPath, sig2X + 20, sigY - sigImgH - 2, { height: sigImgH, fit: [sigW - 20, sigImgH] });
    }
  } catch(e) {}
  doc.moveTo(sig2X, sigY+2).lineTo(sig2X+sigW, sigY+2).lineWidth(0.8).stroke('#94a3b8');
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
     .text('Mr.A S Borse', sig2X, sigY+7, { width: sigW, align: 'center' });
  doc.fillColor('#64748b').fontSize(8).font('Helvetica')
     .text(`Founder & CEO, ${COMPANY.name}`, sig2X, sigY+21, { width: sigW, align: 'center' });

  // ── Dark Footer ───────────────────────────────────────────────
  doc.rect(20, H-60, W-40, 40).fill('#0f172a');
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
     .text(`${COMPANY.email}  |  ${COMPANY.website}  |  ${COMPANY.address}`, 0, H-47, { align: 'center' });

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
  const batches = await Batch.findAll({
    where: { institutionId },
    include: [{ model: Course, as: 'course', attributes: ['id','name'] }],
    order: [['createdAt','DESC']], limit: 10,
  });
  const batchesWithCount = await Promise.all(batches.map(async b => {
    const count = await BatchStudent.count({ where: { batchId: b.id } });
    return { ...b.toJSON(), studentCount: count };
  }));
  const completedBatches = batchesWithCount.filter(b => b.status === 'Completed');
  const recentBatches = batchesWithCount.filter(b => b.status !== 'Completed').slice(0, 5);
  res.json({ success: true, data: { totalStudents, totalBatches, totalCourses, totalCertificates, recentStudents, recentBatches, completedBatches } });
});

// ── Bulk Import Students from CSV/Excel ──────────────────────────
const bulkImportStudents = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  if (!req.file) { res.status(400); throw new Error('No file uploaded'); }

  // Parse file
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) { res.status(400); throw new Error('File is empty'); }

  const results = { created: [], skipped: [], errors: [] };

  for (const row of rows) {
    const name  = (row['Name'] || row['name'] || row['Student Name'] || '').toString().trim();
    const email = (row['Email'] || row['email'] || '').toString().trim().toLowerCase();
    const dept  = (row['Department'] || row['department'] || row['Branch'] || '').toString().trim();
    const roll  = (row['Roll No'] || row['rollNumber'] || row['Roll Number'] || '').toString().trim();
    const mobile= (row['Mobile'] || row['mobile'] || row['Phone'] || '').toString().trim();
    const year  = (row['Year'] || row['year'] || '').toString().trim();

    if (!name || !email) {
      results.errors.push({ row: name || email || 'Unknown', reason: 'Name and email required' });
      continue;
    }

    try {
      const exists = await InstitutionStudent.findOne({ where: { institutionId, email } });
      if (exists) {
        results.skipped.push({ name, email, reason: 'Already exists', careerId: exists.careerId });
        continue;
      }

      const careerId = await generateCareerId();
      const pwd = defaultPassword(careerId);

      const student = await InstitutionStudent.create({
        institutionId, careerId, password: pwd,
        name, email, mobile, department: dept, rollNumber: roll, year,
        skills: [],
      });

      results.created.push({ name, email, careerId, defaultPassword: pwd, department: dept });
    } catch (err) {
      results.errors.push({ row: name, reason: err.message });
    }
  }

  res.json({
    success: true,
    summary: {
      total: rows.length,
      created: results.created.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
    data: results,
  });
});

// ── Issue Certificates by Batch ───────────────────────────────────
const issueCertificatesByBatch = asyncHandler(async (req, res) => {
  const institutionId = getInstitutionId(req);
  const { batchId, type, courseId } = req.body;

  if (!batchId || !type) { res.status(400); throw new Error('batchId and type required'); }

  const inst = await Institution.findOne({ where: { userId: req.user.id } });
  const batch = await Batch.findOne({
    where: { id: batchId, institutionId },
    include: [{ model: Course, as: 'course' }],
  });
  if (!batch) { res.status(404); throw new Error('Batch not found'); }

  // Get all students in batch
  const batchStudents = await BatchStudent.findAll({
    where: { batchId: batch.id },
    include: [{ model: InstitutionStudent, as: 'student' }],
  });

  if (batchStudents.length === 0) {
    return res.json({ success: true, summary: { total: 0, issued: 0, skipped: 0 }, data: [] });
  }

  // Resolve course
  let resolvedCourseId = courseId || batch.courseId || null;
  let courseName = null;
  if (resolvedCourseId) {
    const course = await Course.findOne({ where: { id: resolvedCourseId, institutionId } });
    if (course) courseName = course.name;
  } else if (batch.course) {
    resolvedCourseId = batch.course.id;
    courseName = batch.course.name;
  }

  const results = [];
  let issued = 0, skipped = 0;

  for (const bs of batchStudents) {
    const student = bs.student;
    if (!student) continue;

    // Check if already issued
    const already = await InstitutionCertificate.findOne({
      where: { institutionId, studentId: student.id, type, courseId: resolvedCourseId || null },
    });

    if (already) {
      skipped++;
      results.push({ name: student.name, careerId: student.careerId, status: 'skipped', reason: 'Already issued' });
      continue;
    }

    await InstitutionCertificate.create({
      institutionId, studentId: student.id,
      courseId: resolvedCourseId || null, type,
      studentName: student.name, courseName,
      institutionName: inst.institutionName,
    });
    issued++;
    results.push({ name: student.name, careerId: student.careerId, status: 'issued' });
  }

  res.json({
    success: true,
    summary: { total: batchStudents.length, issued, skipped },
    data: results,
  });
});

module.exports = {
  getProfile, updateProfile,
  getStudents, createStudent, updateStudent, deleteStudent, getStudent,
  bulkImportStudents, getStudentCredentials,
  getBatches, createBatch, updateBatch, deleteBatch, getBatchStudents,
  assignStudentsToBatch, removeStudentFromBatch,
  getCourses, createCourse, updateCourse, deleteCourse, getCourseStudents, assignStudentsToCourse,
  getCertificates, issueCertificate, verifyCertificate, downloadCertificatePDF,
  getDashboardStats,
};