const express = require('express');
const router = express.Router();
const {
  submitInstitutionRequest,
  getInstitutionRequests,
  updateInstitutionRequestStatus,
} = require('../controllers/institutionController');
const { protect, authorize } = require('../middleware/auth');

// Public — an institute submits a registration request
router.post('/register', submitInstitutionRequest);

// Admin — list all requests and approve/reject them
router.get('/', protect, authorize('admin'), getInstitutionRequests);
router.put('/:id/status', protect, authorize('admin'), updateInstitutionRequestStatus);

module.exports = router;
