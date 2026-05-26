/**
 * models/Application.js — Job Application Model (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 *          DataTypes.JSON   → DataTypes.JSONB
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Application = sequelize.define('Application', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  jobId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'jobs', key: 'id' },
  },
  studentId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'students', key: 'id' },
  },
  appliedById: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  status: {
    type: DataTypes.STRING(30), defaultValue: 'Applied',
    validate: { isIn: [['Applied','Under Review','Shortlisted','Interview Scheduled','Selected','Rejected','Withdrawn']] },
  },
  statusHistory:    { type: DataTypes.JSONB, defaultValue: [] },
  coverLetter:      { type: DataTypes.TEXT, allowNull: true },
  resumeFilename:   { type: DataTypes.STRING(255), allowNull: true },
  resumeUrl:        { type: DataTypes.STRING(500), allowNull: true },
  matchScore:       { type: DataTypes.FLOAT, allowNull: true },
  interviewAt:      { type: DataTypes.DATE, allowNull: true },
  interviewMode: {
    type: DataTypes.STRING(10), allowNull: true,
    validate: { isIn: [['Online','Offline','Phone', null]] },
  },
  interviewLocation: { type: DataTypes.STRING(300), allowNull: true },
  meetingLink:       { type: DataTypes.STRING(500), allowNull: true },
  interviewNotes:    { type: DataTypes.TEXT, allowNull: true },
  companyNotes:      { type: DataTypes.TEXT, allowNull: true },
  isEligible:        { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'applications',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['jobId', 'studentId'] },
    { fields: ['studentId'] },
    { fields: ['status'] },
  ],
  hooks: {
    beforeUpdate: (app) => {
      if (app.changed('status')) {
        const history = app.statusHistory || [];
        history.push({ status: app.status, changedAt: new Date() });
        app.statusHistory = history;
      }
    },
  },
});

module.exports = Application;
