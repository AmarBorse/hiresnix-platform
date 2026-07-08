/**
 * models/InstitutionStudent.js — Students enrolled under an Institution
 * Added: password (hashed), lastLogin
 * Note: unique constraint on careerId handled via SQL migration only
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const InstitutionStudent = sequelize.define('InstitutionStudent', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: { type: DataTypes.BIGINT, allowNull: false },
  careerId:      { type: DataTypes.STRING(20), allowNull: true },
  password:      { type: DataTypes.STRING(255), allowNull: true },
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
  lastLogin:     { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'institution_students',
  timestamps: true,
  hooks: {
    beforeCreate: async (student) => {
      if (student.password) student.password = await bcrypt.hash(student.password, 10);
    },
    beforeUpdate: async (student) => {
      if (student.changed('password') && student.password) {
        student.password = await bcrypt.hash(student.password, 10);
      }
    },
  },
});

InstitutionStudent.prototype.matchPassword = async function(entered) {
  return await require('bcryptjs').compare(entered, this.password);
};

module.exports = InstitutionStudent;
