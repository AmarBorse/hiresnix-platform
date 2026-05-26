/**
 * models/Certificate.js (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Certificate = sequelize.define('Certificate', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  certificateId: {
    type: DataTypes.STRING(50), unique: true,
    defaultValue: () => `CERT-${uuidv4().slice(0,8).toUpperCase()}`,
  },
  studentId:       { type: DataTypes.BIGINT, allowNull: false },
  enrollmentId:    { type: DataTypes.BIGINT },
  internshipTitle: { type: DataTypes.STRING(200) },
  studentName:     { type: DataTypes.STRING(100) },
  domain:          { type: DataTypes.STRING(100) },
  issuedAt:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isValid:         { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'certificates', timestamps: true,
});

module.exports = Certificate;
