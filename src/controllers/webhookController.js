const db = require('../config/db');

const getWebhooks = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const query = 'SELECT id, url, event FROM webhooks WHERE tenant_id = $1 ORDER BY created_at DESC';
        const { rows } = await db.query(query, [tenant_id]);

        res.status(200).json({ status: 'success', data: { webhooks: rows } });
    } catch (error) {
        next(error);
    }
};

const createWebhook = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const { url, event } = req.body;

        if (!url || !event) {
            const err = new Error('URL and event are required');
            err.status = 400;
            throw err;
        }

        const query = `
            INSERT INTO webhooks (tenant_id, url, event)
            VALUES ($1, $2, $3)
            RETURNING id, url, event;
        `;
        
        const { rows } = await db.query(query, [tenant_id, url, event]);

        res.status(201).json({ status: 'success', data: rows[0] });
    } catch (error) {
        next(error);
    }
};

const deleteWebhook = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tenant_id } = req.user;

        const query = 'DELETE FROM webhooks WHERE id = $1 AND tenant_id = $2 RETURNING id';
        const { rows } = await db.query(query, [id, tenant_id]);

        if (rows.length === 0) {
            const err = new Error('Webhook not found or unauthorized');
            err.status = 404;
            throw err;
        }

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

module.exports = { getWebhooks, createWebhook, deleteWebhook };
