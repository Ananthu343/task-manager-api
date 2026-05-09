const { Pool } = require('pg');
require('dotenv').config();

// The pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error if a connection takes > 2 seconds
});

// Event listener for errors on idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
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