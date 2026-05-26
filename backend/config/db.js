/**
 * config/db.js — Supabase (PostgreSQL) Connection
 *
 * Only this file changes from the original MySQL version.
 * All models, controllers, routes, and middleware stay exactly the same.
 *
 * Setup:
 *   npm uninstall mysql2
 *   npm install pg pg-hstore
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Supabase (PostgreSQL) connected via Sequelize');
    await sequelize.sync({ alter: true });
    console.log('✅ All tables synced');
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
