const { Pool } = require('pg');
require('dotenv').config();

const { Signer } = require('@aws-sdk/rds-signer');

// Function to generate the RDS auth token dynamically using AWS SDK v3
// The pool configuration
const pool = new Pool({
  host: 'database-1.c7yymymk4ix9.eu-north-1.rds.amazonaws.com', // Get this from the 'Endpoints' tab
  port: 5432,
  database: 'task_manager', // Or your specific DB name
  user: 'postgres',     // Your master username
  password: 'taskManager343', 
  ssl: { rejectUnauthorized: false }, // REQUIRED for RDS
  connectionTimeoutMillis: 5000,
});

// Event listener for errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  connectDB: async () => {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected');
      client.release();
    } catch (err) {
      console.error('❌ DB Connection Error:', err.message);
    }
  },
  /**
   * Main query method
   * @param {string} text - The SQL query
   * @param {Array} params - The values to inject (prevents SQL Injection)
   */
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log queries in development mode for debugging performance
      if (process.env.NODE_ENV === 'development') {
        console.log('executed query', { text, duration, rows: res.rowCount });
      }
      
      return res;
    } catch (error) {
      console.error('Query Error:', error.message);
      throw error;
    }
  },
  
  // Useful for Transactions (advanced postgres feature)
  getClient: () => pool.connect(),
};