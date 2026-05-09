const db = require('../config/db');

const taskModel = {
  /**
   * Find all tasks belonging to a specific tenant
   * Pro Tip: We join with workspaces to show more context to the user
   */
  findAll: async (tenant_id) => {
    const query = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority, 
        t.due_date,
        w.name as workspace_name
      FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE w.tenant_id = $1
      ORDER BY t.created_at DESC;
    `;
    
    const { rows } = await db.query(query, [tenant_id]);
    return rows;
  },

  /**
   * Create a new task
   * We return the full object so the frontend can update immediately
   */
  create: async ({ title, description, workspace_id, creator_id, priority, metadata, status }) => {
    const query = `
      INSERT INTO tasks (
        title, 
        description, 
        workspace_id, 
        creator_id, 
        priority, 
        metadata,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'pending'))
      RETURNING *;
    `;
    
    const values = [
      title, 
      description, 
      workspace_id, 
      creator_id, 
      priority, 
      JSON.stringify(metadata), // Store as JSONB
      status
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  findById: async (id, tenant_id) => {
    const query = `
      SELECT t.* FROM tasks t
      JOIN workspaces w ON t.workspace_id = w.id
      WHERE t.id = $1 AND w.tenant_id = $2;
    `;
    const { rows } = await db.query(query, [id, tenant_id]);
    return rows[0];
  },

  update: async (id, tenant_id, data) => {
    const query = `
      UPDATE tasks t
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        priority = COALESCE($4, priority)
      FROM workspaces w
      WHERE t.workspace_id = w.id 
      AND t.id = $5 AND w.tenant_id = $6
      RETURNING t.*;
    `;
    const values = [data.title, data.description, data.status, data.priority, id, tenant_id];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  delete: async (id, tenant_id) => {
    const query = `
      DELETE FROM tasks t
      USING workspaces w
      WHERE t.workspace_id = w.id 
      AND t.id = $1 AND w.tenant_id = $2
      RETURNING t.id;
    `;
    const { rows } = await db.query(query, [id, tenant_id]);
    return rows.length > 0;
  }
};

module.exports = taskModel;