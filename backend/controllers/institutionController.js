const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const { InstitutionRequest, User } = require('../models');
const { sequelize } = require('../config/db');

const toDto = (request, extra = {}) => ({
  id: request.id,
  name: request.instituteName,
  instituteName: request.instituteName,
  adminName: request.adminName,
  email: request.email,
  contact: request.email,
  phone: request.phone,
  website: request.website,
  city: request.city,
  status: request.status,
  submittedOn: request.createdAt,
  reviewedAt: request.reviewedAt,
  reviewNote: request.reviewNote,
  hasLoginAccount: !!request.userId,
  ...extra,
});

function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url'); // 12-char, URL-safe
}

const submitInstitutionRequest = asyncHandler(async (req, res) => {
  const { adminName, email, instituteName, city, phone, website } = req.body;

  if (!adminName || !email || !instituteName || !city) {
    res.status(400);
    throw new Error('Admin name, email, institution name and city are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingPending = await InstitutionRequest.findOne({
    where: {
      email: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail),
      status: 'pending',
    },
  });

  if (existingPending) {
    res.status(400);
    throw new Error('A pending institution request already exists for this email');
  }

  const request = await InstitutionRequest.create({
    adminName,
    email: cleanEmail,
    instituteName,
    city,
    phone,
    website,
  });

  res.status(201).json({ success: true, data: toDto(request) });
});

const getInstitutionRequests = asyncHandler(async (req, res) => {
  const requests = await InstitutionRequest.findAll({
    order: [['createdAt', 'DESC']],
  });

  res.json({
    success: true,
    data: requests.map(toDto),
  });
});

const updateInstitutionRequestStatus = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Status must be approved or rejected');
  }

  const request = await InstitutionRequest.findByPk(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Institution request not found');
  }

  request.status = status;
  request.reviewNote = reviewNote || null;
  request.reviewedById = req.user?.id || null;
  request.reviewedAt = new Date();

  let tempPassword = null;

  if (status === 'approved' && !request.userId) {
    const cleanEmail = request.email.trim().toLowerCase();
    let account = await User.findOne({
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail),
    });

    if (account) {
      if (account.role !== 'institution') {
        res.status(400);
        throw new Error(`Email ${cleanEmail} already belongs to a ${account.role} account and cannot be reused for an institution login`);
      }
    } else {
      tempPassword = generateTempPassword();
      account = await User.create({
        name: request.adminName,
        email: cleanEmail,
        password: tempPassword,
        role: 'institution',
      });
    }

    request.userId = account.id;
  }

  await request.save();

  res.json({ success: true, data: toDto(request, tempPassword ? { tempPassword } : {}) });
});

module.exports = {
  submitInstitutionRequest,
  getInstitutionRequests,
  updateInstitutionRequestStatus,
};
