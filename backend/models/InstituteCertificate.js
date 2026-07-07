const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstituteCertificate = sequelize.define('InstituteCertificate', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'institution_requests', key: 'id' },
  },
  studentId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'institute_students', key: 'id' },
  },
  certificateNo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  type: {
    type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Course Completion',
    validate: {
      isIn: {
        args: [['Course Completion', 'Training Completion', 'Skill Assessment', 'Merit']],
        msg: 'Invalid certificate type',
      },
    },
  },
  course: { type: DataTypes.STRING(200), allowNull: true },
  issuedOn: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'institute_certificates',
  timestamps: true,
});

module.exports = InstituteCertificate;
