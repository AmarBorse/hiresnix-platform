const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstituteBatch = sequelize.define('InstituteBatch', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'institution_requests', key: 'id' },
  },
  courseId: {
    type: DataTypes.BIGINT, allowNull: true,
    references: { model: 'institute_courses', key: 'id' },
  },
  name: { type: DataTypes.STRING(100), allowNull: false },
  trainerName: { type: DataTypes.STRING(100), allowNull: true },
  schedule: { type: DataTypes.STRING(100), allowNull: true },
  status: {
    type: DataTypes.STRING(20), allowNull: false, defaultValue: 'upcoming',
    validate: { isIn: { args: [['upcoming', 'active', 'completed']], msg: 'Invalid batch status' } },
  },
}, {
  tableName: 'institute_batches',
  timestamps: true,
});

module.exports = InstituteBatch;
