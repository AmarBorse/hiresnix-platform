const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstituteStudent = sequelize.define('InstituteStudent', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: {
    type: DataTypes.BIGINT, allowNull: false,
    references: { model: 'institution_requests', key: 'id' },
  },
  batchId: {
    type: DataTypes.BIGINT, allowNull: true,
    references: { model: 'institute_batches', key: 'id' },
  },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: true, validate: { isEmail: true } },
  careerId: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  attendance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  progress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  assessmentScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  skills: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
  internshipEligible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'institute_students',
  timestamps: true,
});

module.exports = InstituteStudent;
