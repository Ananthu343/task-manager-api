const db = require('../config/db');

const User = {
  create: async ({ tenant_id, email, password_hash, role }) => {
    const query = `
      INSERT INTO users (tenant_id, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, tenant_id, created_at;
    `;
    const values = [tenant_id, email, password_hash, role || 'member'];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  }
};

module.exports = User;