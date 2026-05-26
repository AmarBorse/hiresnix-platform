/**
 * models/Enrollment.js (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 *          DataTypes.JSON   → DataTypes.JSONB
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Enrollment = sequelize.define('Enrollment', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  studentId:     { type: DataTypes.BIGINT, allowNull: false },
  internshipId:  { type: DataTypes.BIGINT, allowNull: false },
  progress:      { type: DataTypes.INTEGER, defaultValue: 0 },
  completedTasks:{ type: DataTypes.JSONB, defaultValue: [] },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Enrolled',
    validate: { isIn: [['Enrolled','In Progress','Completed','Dropped']] },
  },
  completedAt: { type: DataTypes.DATE },
  taskLogs:    { type: DataTypes.JSONB, defaultValue: [] },
}, {
  tableName:  'enrollments',
  timestamps: true,
  indexes: [{ unique: true, fields: ['studentId', 'internshipId'] }],
});

module.exports = Enrollment;
