const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Enquiry = sequelize.define('Enquiry', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  interest: { type: DataTypes.STRING(50) },
  message: { type: DataTypes.TEXT, allowNull: false },
  isRead: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    field: 'isRead' 
  },
}, {
  tableName: 'enquiries',
  timestamps: true,
});

module.exports = Enquiry;