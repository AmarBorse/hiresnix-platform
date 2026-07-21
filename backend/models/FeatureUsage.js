const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FeatureUsage = sequelize.define('FeatureUsage', {
  id:        { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:    { type: DataTypes.INTEGER, allowNull: true },
  feature:   { type: DataTypes.STRING(50), allowNull: false }, // 'mock_interview','resume_builder','academy','internship','career_roadmap','cold_email','jd_match','cover_letter'
  action:    { type: DataTypes.STRING(50), defaultValue: 'view' }, // 'view','complete','download'
  metadata:  { type: DataTypes.JSONB, defaultValue: {} },
}, {
  tableName: 'feature_usage',
  timestamps: true,
  updatedAt: false,
});

module.exports = FeatureUsage;
