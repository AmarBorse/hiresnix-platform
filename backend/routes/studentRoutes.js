const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const r       = express.Router();
const { getStudentProfile, updateStudentProfile, uploadResume, getJobRecommendations, getAllStudents } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// Ensure the uploads directory exists to prevent crashes
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, `resume_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.doc', '.docx'].includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'), false);
  }
});

r.get('/',                protect, authorize('admin'),   getAllStudents);
r.get('/profile',         protect, authorize('student'), getStudentProfile);
r.put('/profile',         protect, authorize('student'), updateStudentProfile);
r.put('/resume',          protect, authorize('student'), upload.single('resume'), uploadResume);
r.get('/recommendations', protect, authorize('student'), getJobRecommendations);
module.exports = r;
