const db = require('../config/db');

const createTenant = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Organization name is required' });
        }

        const query = 'INSERT INTO tenants (name) VALUES ($1) RETURNING *';
        const { rows } = await db.query(query, [name]);

        res.status(201).json({
            status: 'success',
            data: { tenant: rows[0] }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTenant };