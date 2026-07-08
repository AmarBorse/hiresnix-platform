/**
 * models/CourseStudent.js — Junction: Course ↔ InstitutionStudent
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CourseStudent = sequelize.define('CourseStudent', {
  id:        { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  courseId:  { type: DataTypes.BIGINT, allowNull: false, references: { model: 'courses', key: 'id' } },
  studentId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institution_students', key: 'id' } },
  enrolledAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Enrolled',
    validate: { isIn: [['Enrolled', 'Completed', 'Dropped']] },
  },
}, {
  tableName: 'course_students', timestamps: true,
  indexes: [{ unique: true, fields: ['courseId', 'studentId'] }],
});

module.exports = CourseStudent;
