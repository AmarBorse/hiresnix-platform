const express = require('express');
const router = express.Router();
const { submitInstitutionRequest } = require('../controllers/institutionController');

router.post('/register', submitInstitutionRequest);

module.exports = router;
