/**
 * server.js — Smart Placement Portal Backend (MySQL + Sequelize)
 */

const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

dotenv.config();

const { connectDB } = require('./config/db');
// Load all models & associations
require('./models/index');

connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://hiresnix.co.in',
  'https://www.hiresnix.co.in',
  'https://hirenix.co.in',
  'https://www.hirenix.co.in',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(helmet());
app.use(rateLimit({ windowMs: 10 * 60 * 1000, max: 200 }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/public',       require('./routes/publicRoutes'));
app.use('/api/auth',         require('./routes/authRoutes'));
app.use('/api/students',     require('./routes/studentRoutes'));
app.use('/api/companies',    require('./routes/companyRoutes'));
app.use('/api/jobs',         require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/admin',        require('./routes/adminRoutes'));
app.use('/api/analytics',    require('./routes/analyticsRoutes'));
app.use('/api/iplatform', require('./routes/internshipPlatformRoutes'));
app.use('/api/internships',  require('./routes/internshipRoutes'));
app.use('/api/resources',    require('./routes/resourceRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/institutions', require('./routes/institutionRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'MySQL (Sequelize)', timestamp: new Date() }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`📦 API → http://localhost:${PORT}/api`);
});
