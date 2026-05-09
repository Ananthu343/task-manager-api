const taskModel = require('../models/taskModel');

const mapPriorityToInt = (priority) => {
    if (typeof priority === 'number') return priority;
    const map = { low: 1, medium: 3, high: 4, critical: 5 };
    return map[priority?.toLowerCase()] || 3;
};

const getAllTasks = async (req, res, next) => {
    try {
        const { tenant_id } = req.user; 
        const tasks = await taskModel.findAll(tenant_id);
        res.status(200).json({ status: 'success', results: tasks.length, data: { tasks } });
    } catch (error) {        
        next(error);
    }
};

const createTask = async (req, res, next) => {
    try {
        const { title, description, workspace_id, priority, metadata, due_date, status } = req.body;
        const creator_id = req.user.id;

        if (!title || !workspace_id) {
            const err = new Error('Title and Workspace ID are required');
            err.status = 400;
            throw err;
        }

        const newTask = await taskModel.create({
            title, description, workspace_id, creator_id, 
            priority: mapPriorityToInt(priority), 
            metadata: metadata || {},
            due_date,
            status
        });

        const io = req.app.get('io');
        if (io) {
            io.to(`tenant_${req.user.tenant_id}`).emit('task_created', newTask);
        }

        res.status(201).json({ status: 'success', data: { task: newTask } });
    } catch (error) {
        next(error);
    }
};

const getTask = async (req, res, next) => {
    try {
        const task = await taskModel.findById(req.params.id, req.user.tenant_id);
        if (!task) {
            const err = new Error('Task not found or unauthorized');
            err.status = 404;
            throw err;
        }
        res.status(200).json({ status: 'success', data: { task } });
    } catch (error) {
        next(error);
    }
};

const updateTask = async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        if (updateData.priority !== undefined) {
            updateData.priority = mapPriorityToInt(updateData.priority);
        }
        
        const updatedTask = await taskModel.update(req.params.id, req.user.tenant_id, updateData);
        if (!updatedTask) {
            const err = new Error('Task not found or unauthorized');
            err.status = 404;
            throw err;
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`tenant_${req.user.tenant_id}`).emit('task_updated', updatedTask);
        }

        res.status(200).json({ status: 'success', data: { task: updatedTask } });
    } catch (error) {
        next(error);
    }
};

const deleteTask = async (req, res, next) => {
    try {
        const deleted = await taskModel.delete(req.params.id, req.user.tenant_id);
        if (!deleted) {
            const err = new Error('Task not found or unauthorized');
            err.status = 404;
            throw err;
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`tenant_${req.user.tenant_id}`).emit('task_deleted', { id: req.params.id });
        }

        res.status(204).json({ status: 'success', data: null });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllTasks,
    createTask,
    getTask,
    updateTask,
    deleteTask
};