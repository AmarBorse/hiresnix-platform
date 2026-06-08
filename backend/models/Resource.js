/**
 * models/Resource.js (Sequelize + PostgreSQL/Supabase)
 * Changed: DataTypes.INTEGER → DataTypes.BIGINT
 *          DataTypes.ENUM   → DataTypes.STRING with validate
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { DOMAIN_OPTIONS } = require('../utils/domains');

const Resource = sequelize.define('Resource', {
  id:       { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  title:    { type: DataTypes.STRING(200), allowNull: false },
  type: {
    type: DataTypes.STRING(20), defaultValue: 'Video',
    validate: { isIn: [['Video','Note','Article','PDF']] },
  },
  link:        { type: DataTypes.STRING(500) },
  domain: {
    type: DataTypes.STRING(100), allowNull: true,
    validate: { isIn: [DOMAIN_OPTIONS] },
  },
  category:    { type: DataTypes.STRING(100) },
  badge:       { type: DataTypes.STRING(50) },
  isPublic:    { type: DataTypes.BOOLEAN, defaultValue: true },
  createdById: { type: DataTypes.BIGINT },
}, {
  tableName: 'resources', timestamps: true,
});

module.exports = Resource;
