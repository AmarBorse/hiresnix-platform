/**
 * models/BatchStudent.js — Junction: Batch ↔ InstitutionStudent
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BatchStudent = sequelize.define('BatchStudent', {
  id:        { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  batchId:   { type: DataTypes.BIGINT, allowNull: false, references: { model: 'batches', key: 'id' } },
  studentId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institution_students', key: 'id' } },
}, {
  tableName: 'batch_students', timestamps: true,
  indexes: [{ unique: true, fields: ['batchId', 'studentId'] }],
});

module.exports = BatchStudent;
