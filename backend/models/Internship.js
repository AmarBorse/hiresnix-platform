/**
 * models/Internship.js (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 *          DataTypes.JSON   → DataTypes.JSONB
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Internship = sequelize.define('Internship', {
  id:          { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  title:       { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT },
  domain:      { type: DataTypes.STRING(100) },
  duration:    { type: DataTypes.STRING(50) },
  difficulty: {
    type: DataTypes.STRING(20), defaultValue: 'Intermediate',
    validate: { isIn: [['Beginner','Intermediate','Advanced']] },
  },
  technologies:      { type: DataTypes.JSONB, defaultValue: [] },
  tasks:             { type: DataTypes.JSONB, defaultValue: [] },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Active',
    validate: { isIn: [['Active','Inactive']] },
  },
  createdById:       { type: DataTypes.BIGINT, allowNull: false },
  maxEnrollments:    { type: DataTypes.INTEGER, defaultValue: 100 },
  enrollmentCount:   { type: DataTypes.INTEGER, defaultValue: 0 },
  startDate:         { type: DataTypes.DATEONLY },
  endDate:           { type: DataTypes.DATEONLY },
  relatedJobDomains: { type: DataTypes.JSONB, defaultValue: [] },
}, {
  tableName: 'internships', timestamps: true,
});

module.exports = Internship;
