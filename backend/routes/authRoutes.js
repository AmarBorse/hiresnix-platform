// ─── routes/authRoutes.js ─────────────────────────────────────────
const express = require('express');
const r = express.Router();
const {
  register,
  login,
  getMe,
  updatePassword,
  verifyEmail,
  resendVerification,
  clearLockout,
  clearAllLockouts,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
r.put('/updatepassword', protect, updatePassword);
// Public: list approved institutions (cached 5 min)
let _instCache = null;
let _instCacheTime = 0;
r.get('/institutions', async (req, res) => {
  try {
    const now = Date.now();
    if (_instCache && now - _instCacheTime < 5 * 60 * 1000) {
      return res.json({ success: true, data: _instCache });
    }
    const { sequelize } = require('../config/db');
    const institutions = await sequelize.query(
      'SELECT id, "institutionName" FROM institutions WHERE "isVerified" = true ORDER BY "institutionName" ASC',
      { type: sequelize.QueryTypes.SELECT }
    );
    _instCache = institutions;
    _instCacheTime = now;
    res.json({ success: true, data: institutions });
  } catch (err) {
    res.status(500).json({ success: false, data: [] });
  }
});

r.get('/verify-email', verifyEmail);
r.post('/resend-verification', resendVerification);
r.post('/clear-lockout', protect, authorize('admin'), clearLockout);
r.post('/clear-all-lockouts', protect, authorize('admin'), clearAllLockouts);
module.exports = r;