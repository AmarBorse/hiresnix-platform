const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstituteCourse = sequelize.define('InstituteCourse', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'institution_requests', key: 'id' },
  },
  title: { type: DataTypes.STRING(200), allowNull: false },
  duration: { type: DataTypes.STRING(50), allowNull: true },
  modules: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  completionRate: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'institute_courses',
  timestamps: true,
});

module.exports = InstituteCourse;
