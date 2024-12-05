const pgPromise = require('pg-promise');
require('dotenv').config();

// Initialize pg-promise with simplified logging
const initOptions = {
  // Standard error logging
  error: (error, e) => {
    console.error('Database Error:', error);
    if (e && e.cn) {
      console.error('Connection Details:', e.cn);
    }
  },
  // Simplified connection logging
  connect: () => {
    console.log('Database connection established successfully');
  },
  disconnect: () => {
    console.log('Database connection closed');
  }
};

// Initialize pg-promise with options
const pgp = pgPromise(initOptions);

// Connection configuration
const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'projx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Admin@123',
  // Optional SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create and export the database connection
const db = pgp(connection);

module.exports = db;