const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Ensure the 'uploads/' directory exists before saving
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure where and how the file is saved
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    // Create a unique filename: resume-[userId]-[timestamp].[extension]
    cb(null, `resume-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 3. File type filter - only allow PDF and Word docs
const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents (.pdf, .doc, .docx) are allowed'), false);
  }
};

// 4. Initialize multer with storage, file filter and 5MB size limit
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

module.exports = upload;