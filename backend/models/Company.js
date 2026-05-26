/**
 * models/Company.js — Company Profile Model (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Company = sequelize.define('Company', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  userId: {
    type: DataTypes.BIGINT, allowNull: false, unique: true,
    references: { model: 'users', key: 'id' },
  },
  companyName:  { type: DataTypes.STRING(200), allowNull: false },
  industry: {
    type: DataTypes.STRING(50), allowNull: true,
    validate: {
      isIn: {
        args: [['IT/Software','Finance','Healthcare','E-commerce','Manufacturing','Consulting','Media','Education','Other', null, '']],
        msg: 'Invalid industry type'
      }
    },
  },
  website:      { type: DataTypes.STRING(300), allowNull: true },
  description:  { type: DataTypes.TEXT, allowNull: true },
  logo:         { type: DataTypes.STRING(500), allowNull: true },
  headquarters: { type: DataTypes.STRING(200), allowNull: true },
  employeeCount: {
    type: DataTypes.STRING(20), allowNull: true,
    validate: {
      isIn: {
        args: [['1-10','11-50','51-200','201-500','500+', null, '']],
        msg: 'Invalid employee count'
      }
    },
  },
  contactName:        { type: DataTypes.STRING(100), allowNull: true },
  contactDesignation: { type: DataTypes.STRING(100), allowNull: true },
  contactPhone:       { type: DataTypes.STRING(20),  allowNull: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'companies', timestamps: true,
});

module.exports = Company;
