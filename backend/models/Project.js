const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId:      { type: DataTypes.INTEGER, allowNull: false },
  title:       { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  techStack:   { type: DataTypes.JSONB, defaultValue: [] },       // ["React","Node.js"]
  liveUrl:     { type: DataTypes.STRING(300), defaultValue: '' },
  githubUrl:   { type: DataTypes.STRING(300), defaultValue: '' },
  imageUrl:    { type: DataTypes.STRING(500), defaultValue: '' }, // screenshot URL
  status:      { type: DataTypes.ENUM('live','in_progress','completed'), defaultValue: 'completed' },
  featured:    { type: DataTypes.BOOLEAN, defaultValue: false },
  views:       { type: DataTypes.INTEGER, defaultValue: 0 },
  order:       { type: DataTypes.INTEGER, defaultValue: 0 },
}, {
  tableName: 'projects',
  timestamps: true,
});

module.exports = Project;
module.exports = { ...require('./index'), Project: require('./Project') };
