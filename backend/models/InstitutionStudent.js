/**
 * models/InstitutionStudent.js — Students enrolled under an Institution
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstitutionStudent = sequelize.define('InstitutionStudent', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institutions', key: 'id' } },
  careerId: {
    type: DataTypes.STRING(20), unique: true, allowNull: true,
    comment: 'Hiresnix Career ID e.g. HX-2026-000001',
  },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  email:         { type: DataTypes.STRING(150), allowNull: false },
  mobile:        { type: DataTypes.STRING(20), allowNull: true },
  dob:           { type: DataTypes.DATEONLY, allowNull: true },
  gender:        { type: DataTypes.STRING(10), allowNull: true },
  address:       { type: DataTypes.TEXT, allowNull: true },
  department:    { type: DataTypes.STRING(100), allowNull: true },
  rollNumber:    { type: DataTypes.STRING(50), allowNull: true },
  year:          { type: DataTypes.INTEGER, allowNull: true },
  skills:        { type: DataTypes.JSON, defaultValue: [] },
  documents:     { type: DataTypes.JSON, defaultValue: [] },
  photo:         { type: DataTypes.STRING(500), allowNull: true },
  isInternshipEligible: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'institution_students', timestamps: true,
  indexes: [
    { fields: ['institutionId'] },
    { fields: ['careerId'], unique: true, where: { careerId: { [require('sequelize').Op ? require('sequelize').Op.ne : Symbol()]: null } } },
    { fields: ['email'] },
  ],
});

module.exports = InstitutionStudent;
