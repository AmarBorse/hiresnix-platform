/**
 * models/Job.js — Job Posting Model (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 *          DataTypes.JSON   → DataTypes.JSONB
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Job = sequelize.define('Job', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  companyId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'companies', key: 'id' },
  },
  postedById: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  title:       { type: DataTypes.STRING(200), allowNull: false },
  type: {
    type: DataTypes.STRING(20), allowNull: false,
    validate: { isIn: [['Full-time','Part-time','Internship','Contract']] },
  },
  description:      { type: DataTypes.TEXT, allowNull: false },
  responsibilities: { type: DataTypes.JSONB, defaultValue: [] },
  requiredSkills:   { type: DataTypes.JSONB, defaultValue: [] },
  preferredSkills:  { type: DataTypes.JSONB, defaultValue: [] },
  minCGPA:            { type: DataTypes.DECIMAL(4,2), defaultValue: 0 },
  allowedDepartments: { type: DataTypes.JSONB, defaultValue: [] },
  allowedYears:       { type: DataTypes.JSONB, defaultValue: [] },
  backlogsAllowed:    { type: DataTypes.BOOLEAN, defaultValue: false },
  salaryMin:     { type: DataTypes.BIGINT, allowNull: true },
  salaryMax:     { type: DataTypes.BIGINT, allowNull: true },
  salaryCurrency:{ type: DataTypes.STRING(10), defaultValue: 'INR' },
  salaryPeriod: {
    type: DataTypes.STRING(20), defaultValue: 'Annual',
    validate: { isIn: [['Monthly','Annual','Stipend']] },
  },
  location:            { type: DataTypes.STRING(200), allowNull: true },
  isRemote:            { type: DataTypes.BOOLEAN, defaultValue: false },
  applicationDeadline: { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Pending',
    validate: { isIn: [['Pending','Approved','Rejected','Closed','Expired']] },
  },
  openings:         { type: DataTypes.INTEGER, defaultValue: 1 },
  applicationCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  rejectionReason:  { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'jobs', timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['companyId'] },
    { fields: ['applicationDeadline'] },
  ],
});

module.exports = Job;
