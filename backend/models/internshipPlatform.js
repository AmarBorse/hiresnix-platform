/**
 * models/internshipPlatform.js
 * New models for the internship platform
 * Add require('./models/internshipPlatform') in models/index.js
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ── DOMAIN ────────────────────────────────────────────────────────
const Domain = sequelize.define('Domain', {
  id:          { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  icon:        { type: DataTypes.STRING(50), defaultValue: '💻' },
  duration:    { type: DataTypes.STRING(50), defaultValue: '8 Weeks' },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
  totalSeats:  { type: DataTypes.INTEGER, defaultValue: 30 },
  filledSeats: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'ip_domains', timestamps: true });

// ── INTERNSHIP APPLICATION ─────────────────────────────────────────
const InternshipApplication = sequelize.define('InternshipApplication', {
  id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId:       { type: DataTypes.BIGINT, allowNull: false },
  domainId:     { type: DataTypes.BIGINT, allowNull: false },
  studentName:  { type: DataTypes.STRING(100), allowNull: false },
  email:        { type: DataTypes.STRING(150), allowNull: false },
  phone:        { type: DataTypes.STRING(20) },
  college:      { type: DataTypes.STRING(200) },
  year:         { type: DataTypes.STRING(20) },
  whyJoin:      { type: DataTypes.TEXT },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Pending',
    validate: { isIn: [['Pending', 'Approved', 'Rejected']] },
  },
  adminNote:    { type: DataTypes.TEXT },
  approvedAt:   { type: DataTypes.DATE },
}, { tableName: 'ip_applications', timestamps: true });

// ── INTERNSHIP ENROLLMENT (after approval) ─────────────────────────
const InternshipEnrollment = sequelize.define('InternshipEnrollment', {
  id:              { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  applicationId:   { type: DataTypes.BIGINT, allowNull: false, unique: true },
  userId:          { type: DataTypes.BIGINT, allowNull: false },
  domainId:        { type: DataTypes.BIGINT, allowNull: false },
  studentName:     { type: DataTypes.STRING(100) },
  email:           { type: DataTypes.STRING(150) },
  progress:        { type: DataTypes.INTEGER, defaultValue: 0 },
  completedTasks:  { type: DataTypes.JSONB, defaultValue: [] },
  taskLogs:        { type: DataTypes.JSONB, defaultValue: [] },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Active',
    validate: { isIn: [['Active', 'Completed', 'Dropped']] },
  },
  startDate:       { type: DataTypes.DATEONLY },
  completedAt:     { type: DataTypes.DATE },
  adminRemark:     { type: DataTypes.TEXT },
  // LOR details filled by admin
  lorPerformance:  { type: DataTypes.STRING(20), defaultValue: 'Good' },
  lorHighlights:   { type: DataTypes.TEXT },
}, { tableName: 'ip_enrollments', timestamps: true });

// ── INTERNSHIP RESOURCE (domain-wise) ─────────────────────────────
const InternshipResource = sequelize.define('InternshipResource', {
  id:          { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  domainId:    { type: DataTypes.BIGINT, allowNull: false },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  type: {
    type: DataTypes.STRING(20), defaultValue: 'Video',
    validate: { isIn: [['Video', 'PDF', 'Article', 'Assignment', 'Link']] },
  },
  url:         { type: DataTypes.STRING(500) },
  description: { type: DataTypes.TEXT },
  week:        { type: DataTypes.INTEGER, defaultValue: 1 },
  isPublic:    { type: DataTypes.BOOLEAN, defaultValue: false },
  addedById:   { type: DataTypes.BIGINT },
}, { tableName: 'ip_resources', timestamps: true });

// ── INTERNSHIP CERTIFICATE ─────────────────────────────────────────
const InternshipCertificate = sequelize.define('InternshipCertificate', {
  id:             { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  enrollmentId:   { type: DataTypes.BIGINT, allowNull: false, unique: true },
  certificateNo:  {
    type: DataTypes.STRING(30), unique: true,
    defaultValue: () => `HRX-${Date.now().toString(36).toUpperCase()}`,
  },
  studentName:    { type: DataTypes.STRING(100) },
  domainName:     { type: DataTypes.STRING(100) },
  issuedAt:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isValid:        { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'ip_certificates', timestamps: true });

// ── ASSOCIATIONS ───────────────────────────────────────────────────
Domain.hasMany(InternshipApplication, { foreignKey: 'domainId', as: 'applications' });
InternshipApplication.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.hasMany(InternshipEnrollment, { foreignKey: 'domainId', as: 'enrollments' });
InternshipEnrollment.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

InternshipApplication.hasOne(InternshipEnrollment, { foreignKey: 'applicationId', as: 'enrollment' });
InternshipEnrollment.belongsTo(InternshipApplication, { foreignKey: 'applicationId', as: 'application' });

Domain.hasMany(InternshipResource, { foreignKey: 'domainId', as: 'resources' });
InternshipResource.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

InternshipEnrollment.hasOne(InternshipCertificate, { foreignKey: 'enrollmentId', as: 'certificate' });
InternshipCertificate.belongsTo(InternshipEnrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });

module.exports = { Domain, InternshipApplication, InternshipEnrollment, InternshipResource, InternshipCertificate };
