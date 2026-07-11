/**
 * models/Batch.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Batch = sequelize.define('Batch', {
  id:            { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  institutionId: { type: DataTypes.BIGINT, allowNull: false, references: { model: 'institutions', key: 'id' } },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  description:   { type: DataTypes.TEXT, allowNull: true },
  startDate:     { type: DataTypes.DATEONLY, allowNull: true },
  endDate:       { type: DataTypes.DATEONLY, allowNull: true },
  trainerName:   { type: DataTypes.STRING(100), allowNull: true },
  trainerEmail:  { type: DataTypes.STRING(150), allowNull: true },
  status: {
    type: DataTypes.STRING(20), defaultValue: 'Active',
    validate: { isIn: [['Active', 'Completed', 'Upcoming']] },
  },
  courseId: { type: DataTypes.BIGINT, allowNull: true, references: { model: 'courses', key: 'id' } },
}, {
  tableName: 'batches', timestamps: true,
});

module.exports = Batch;