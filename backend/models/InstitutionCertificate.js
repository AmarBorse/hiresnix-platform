/**
 * models/InstitutionCertificate.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const InstitutionCertificate = sequelize.define('InstitutionCertificate', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  certificateId: {
    type: DataTypes.STRING(50), unique: true,
    defaultValue: () => `HX-CERT-${uuidv4().slice(0,8).toUpperCase()}`,
  },
  institutionId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institutions', key: 'id' } },
  studentId:     { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institution_students', key: 'id' } },
  courseId:      { type: DataTypes.BIGINT, allowNull: true, references: { model: 'courses', key: 'id' } },
  type: {
    type: DataTypes.STRING(50), allowNull: false,
    validate: { isIn: [['Course Completion', 'Training Completion', 'Skill Assessment']] },
  },
  studentName:      { type: DataTypes.STRING(100), allowNull: false },
  courseName:       { type: DataTypes.STRING(200), allowNull: true },
  institutionName:  { type: DataTypes.STRING(200), allowNull: false },
  issuedAt:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isValid:          { type: DataTypes.BOOLEAN, defaultValue: true },
  emailSent:        { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'institution_certificates', timestamps: true,
});

module.exports = InstitutionCertificate;
