// backend/models/MockInterview.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MockInterview = sequelize.define('MockInterview', {
  id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId:       { type: DataTypes.BIGINT, allowNull: false },
  domain:       { type: DataTypes.STRING(100), allowNull: false },
  round:        { type: DataTypes.STRING(20), defaultValue: 'hr' },
  difficulty:   { type: DataTypes.STRING(10), defaultValue: 'Medium' },
  experience:   { type: DataTypes.STRING(20), defaultValue: 'Fresher' },
  overallScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalQuestions:{ type: DataTypes.INTEGER, defaultValue: 0 },
  communication:{ type: DataTypes.INTEGER, defaultValue: 0 },
  technical:    { type: DataTypes.INTEGER, defaultValue: 0 },
  confidence:   { type: DataTypes.INTEGER, defaultValue: 0 },
  grammar:      { type: DataTypes.INTEGER, defaultValue: 0 },
  problemSolving:{ type: DataTypes.INTEGER, defaultValue: 0 },
  weakTopics:   { type: DataTypes.TEXT, defaultValue: '[]' },
  results:      { type: DataTypes.TEXT, defaultValue: '[]' },
  duration:     { type: DataTypes.INTEGER, defaultValue: 0 }, // seconds
}, {
  tableName: 'mock_interviews',
  timestamps: true,
});

module.exports = MockInterview;
