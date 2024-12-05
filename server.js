const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const db = require('./config/database'); // Import the database connection

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profile', authRoutes);
app.use('/api/login', authRoutes);

// Test database connection before starting the server
async function startServer() {
  try {
    // Test the database connection
    await db.connect();
    console.log('Database connected successfully');

    // Start the server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1); // Exit the process if database connection fails
  }
}

// Call the function to start the server
startServer();

// Optional: Add a simple health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Server is up and running',
    database: 'connected'
  });
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing database connection...');
  try {
    await db.$pool.end(); // Properly close the database connection pool
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database connection:', error);
    process.exit(1);
  }
});