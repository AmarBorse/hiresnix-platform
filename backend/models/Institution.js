/**
 * models/Institution.js — Institution Profile Model
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Institution = sequelize.define('Institution', {
  id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId:       { type: DataTypes.BIGINT, allowNull: false, unique: true, references: { model: 'users', key: 'id' } },
  institutionName: { type: DataTypes.STRING(200), allowNull: false },
  type: {
    type: DataTypes.STRING(50), allowNull: true,
    validate: { isIn: [['University', 'College', 'Institute', 'Training Center', 'School', 'Other']] },
  },
  affiliatedTo:  { type: DataTypes.STRING(200), allowNull: true },
  address:       { type: DataTypes.TEXT, allowNull: true },
  city:          { type: DataTypes.STRING(100), allowNull: true },
  state:         { type: DataTypes.STRING(100), allowNull: true },
  pincode:       { type: DataTypes.STRING(10), allowNull: true },
  website:       { type: DataTypes.STRING(300), allowNull: true },
  phone:         { type: DataTypes.STRING(20), allowNull: true },
  logo:          { type: DataTypes.STRING(500), allowNull: true },
  description:   { type: DataTypes.TEXT, allowNull: true },
  contactName:   { type: DataTypes.STRING(100), allowNull: true },
  contactEmail:  { type: DataTypes.STRING(150), allowNull: true },
  contactPhone:  { type: DataTypes.STRING(20), allowNull: true },
  isVerified:    { type: DataTypes.BOOLEAN, defaultValue: false },
  isPartner:     { type: DataTypes.BOOLEAN, defaultValue: false },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'institutions', timestamps: true,
});

module.exports = Institution;
