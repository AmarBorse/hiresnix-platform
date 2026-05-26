/**
 * models/Student.js — Student Profile Model (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 *          DataTypes.JSON   → DataTypes.JSONB (faster on PostgreSQL)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId: {
    type: DataTypes.BIGINT, allowNull: false, unique: true,
    references: { model: 'users', key: 'id' },
  },
  rollNumber: { type: DataTypes.STRING(50), unique: true, allowNull: true },
  department: {
    type: DataTypes.STRING(50), allowNull: true,
    validate: { isIn: [['Computer Science','Information Technology','Electronics','Mechanical','Civil','MCA','MBA','Other']] },
  },
  year: {
    type: DataTypes.INTEGER, validate: { min: 1, max: 5 }, allowNull: true,
  },
  cgpa: {
    type: DataTypes.DECIMAL(4, 2), validate: { min: 0, max: 10 }, allowNull: true,
  },
  skills:                { type: DataTypes.JSONB, defaultValue: [] },
  resumeFilename:        { type: DataTypes.STRING(255), allowNull: true },
  resumeUrl:             { type: DataTypes.STRING(500), allowNull: true },
  resumeUploadedAt:      { type: DataTypes.DATE, allowNull: true },
  resumeExtractedSkills: { type: DataTypes.JSONB, defaultValue: [] },
  resumeAnalysisScore:   { type: DataTypes.FLOAT, defaultValue: 0 },
  projects:              { type: DataTypes.JSONB, defaultValue: [] },
  certifications:        { type: DataTypes.JSONB, defaultValue: [] },
  education:             { type: DataTypes.JSONB, defaultValue: [] },
  linkedin:              { type: DataTypes.STRING(300), allowNull: true },
  github:                { type: DataTypes.STRING(300), allowNull: true },
  portfolio:             { type: DataTypes.STRING(300), allowNull: true },
  isProfileComplete:     { type: DataTypes.BOOLEAN, defaultValue: false },
  placementStatus: {
    type: DataTypes.STRING(20), defaultValue: 'Not Placed',
    validate: { isIn: [['Not Placed', 'Placed', 'Opted Out']] },
  },
  placedCompany: { type: DataTypes.STRING(200), allowNull: true },
  placedRole:    { type: DataTypes.STRING(200), allowNull: true },
  placedSalary:  { type: DataTypes.BIGINT, allowNull: true },
  placedOn:      { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'students', timestamps: true,
});

module.exports = Student;
