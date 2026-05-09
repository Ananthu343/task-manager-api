const db = require('../config/db');

const getWorkspaces = async (req, res, next) => {
    try {
        const { tenant_id } = req.user;
        const query = 'SELECT * FROM workspaces WHERE tenant_id = $1 ORDER BY name ASC';
        const { rows } = await db.query(query, [tenant_id]);

        res.status(200).json({ status: 'success', data: { workspaces: rows } });
    } catch (error) {
        next(error);
    }
};

const createWorkspace = async (req, res, next) => {
    try {
        const { name } = req.body;
        const { tenant_id } = req.user;

        const query = 'INSERT INTO workspaces (name, tenant_id) VALUES ($1, $2) RETURNING *';
        const { rows } = await db.query(query, [name, tenant_id]);

        res.status(201).json({ status: 'success', data: { workspace: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const getWorkspaceById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tenant_id } = req.user;
        const query = 'SELECT * FROM workspaces WHERE id = $1 AND tenant_id = $2';
        const { rows } = await db.query(query, [id, tenant_id]);
        
        if (rows.length === 0) {
            const err = new Error('Workspace not found');
            err.status = 404;
            throw err;
        }

        res.status(200).json({ status: 'success', data: { workspace: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const updateWorkspace = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const { tenant_id } = req.user;

        const query = 'UPDATE workspaces SET name = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *';
        const { rows } = await db.query(query, [name, id, tenant_id]);

        if (rows.length === 0) {
            const err = new Error('Workspace not found');
            err.status = 404;
            throw err;
        }

        res.status(200).json({ status: 'success', data: { workspace: rows[0] } });
    } catch (error) {
        next(error);
    }
};

const deleteWorkspace = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tenant_id } = req.user;

        // Manual cascading delete of tasks first
        await db.query('DELETE FROM tasks WHERE workspace_id = $1', [id]);

        const query = 'DELETE FROM workspaces WHERE id = $1 AND tenant_id = $2 RETURNING id';
        const { rows } = await db.query(query, [id, tenant_id]);

        if (rows.length === 0) {
            const err = new Error('Workspace not found');
            err.status = 404;
            throw err;
        }

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

module.exports = { getWorkspaces, createWorkspace, getWorkspaceById, updateWorkspace, deleteWorkspace };