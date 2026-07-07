/**
 * middleware/institution.js — resolves the institution_requests row (tenant)
 * that owns the logged-in 'institution' user, and attaches its id to req.
 */

const asyncHandler = require('express-async-handler');
const { InstitutionRequest } = require('../models');

const resolveInstitution = asyncHandler(async (req, res, next) => {
  const institution = await InstitutionRequest.findOne({
    where: { userId: req.user.id, status: 'approved' },
    attributes: ['id', 'instituteName', 'status'],
  });

  if (!institution) {
    res.status(403);
    throw new Error('No approved institution is linked to this account');
  }

  req.institutionId = institution.id;
  req.institution = institution;
  next();
});

module.exports = { resolveInstitution };
