const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const InstitutionRequest = sequelize.define('InstitutionRequest', {
  id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  instituteName: { type: DataTypes.STRING(200), allowNull: false },
  adminName: { type: DataTypes.STRING(100), allowNull: false },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
  },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  website: { type: DataTypes.STRING(300), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: false },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: {
        args: [['pending', 'approved', 'rejected']],
        msg: 'Invalid institution request status',
      },
    },
  },
  reviewedById: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  reviewNote: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'institution_requests',
  timestamps: true,
});

module.exports = InstitutionRequest;
