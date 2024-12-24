const connection = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'projx',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Admin@123',
    // Optional SSL configuration for production
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };