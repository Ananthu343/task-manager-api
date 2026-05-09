const { z } = require('zod');

// Schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").max(255),
  description: z.string().optional(),
  workspace_id: z.string().uuid("Invalid Workspace ID format"),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['pending', 'in-progress', 'completed']).optional(),
  due_date: z.string().datetime().optional(), // Ensures valid ISO date string
  metadata: z.record(z.any()).optional() // Validates it's an object
});

const updateTaskSchema = createTaskSchema.partial();

module.exports = { createTaskSchema, updateTaskSchema };