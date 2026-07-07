const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstituteAssessment = sequelize.define('InstituteAssessment', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'institution_requests', key: 'id' },
  },
  courseId: {
    type: DataTypes.BIGINT, allowNull: true,
    references: { model: 'institute_courses', key: 'id' },
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  submissions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  averageScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'institute_assessments',
  timestamps: true,
});

module.exports = InstituteAssessment;
