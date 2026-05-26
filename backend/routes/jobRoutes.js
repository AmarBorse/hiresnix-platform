const express = require('express');
const r = express.Router();
const { getJobs, getJob, createJob, updateJob, deleteJob, getMyJobPostings } = require('../controllers/jobController');
const { protect, authorize, requireApproved } = require('../middleware/auth');

r.get('/',            protect, getJobs);
r.get('/my-postings', protect, authorize('company'), getMyJobPostings);
r.get('/:id',         protect, getJob);
r.post('/',           protect, authorize('company'), requireApproved, createJob);
r.put('/:id',         protect, authorize('company','admin'), updateJob);
r.delete('/:id',      protect, authorize('company','admin'), deleteJob);
module.exports = r;
