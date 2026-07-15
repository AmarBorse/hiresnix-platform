// backend/routes/mockInterviewRoutes.js
const express = require('express');
const r = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { saveMockInterview, getMyInterviews, deleteMockInterview } = require('../controllers/mockInterviewController');

r.post('/save',   protect, authorize('student'), saveMockInterview);
r.get('/my',      protect, authorize('student'), getMyInterviews);
r.delete('/:id',  protect, authorize('student'), deleteMockInterview);

module.exports = r;
