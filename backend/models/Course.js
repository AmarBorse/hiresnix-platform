/**
 * models/Course.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institutions', key: 'id' } },
  name:          { type: DataTypes.STRING(200), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
  duration:      { type: DataTypes.STRING(50), allowNull: true },
  durationUnit: {
    type: DataTypes.STRING(20), defaultValue: 'Weeks',
    validate: { isIn: [['Days', 'Weeks', 'Months']] },
  },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Active',
    validate: { isIn: [['Active', 'Inactive']] },
  },
}, {
  tableName: 'courses', timestamps: true,
});

module.exports = Course;
