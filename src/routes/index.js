const express = require('express');
const router = express.Router();

const taskRoutes = require('./taskRoutes');
const authRoutes = require('./authRoutes');
const workspaceRoutes = require('./workspaceRoutes');
const tenantController = require('../controllers/tenantController');
const workspaceController = require('../controllers/workspaceController');
const settingsController = require('../controllers/settingsController');
const webhookController = require('../controllers/webhookController');
const { protect } = require('../middleware/jwtMiddleware');

// Public Routes
router.post('/tenants', tenantController.createTenant); // Create organization
router.use('/auth', authRoutes);

// Protected Routes
router.use('/tasks', protect, taskRoutes);
router.use('/workspaces', protect, workspaceRoutes);

// Settings Routes
router.get('/settings', protect, settingsController.getSettings);
router.patch('/settings', protect, settingsController.updateSettings);

// Webhook Routes
router.get('/webhooks', protect, webhookController.getWebhooks);
router.post('/webhooks', protect, webhookController.createWebhook);
router.delete('/webhooks/:id', protect, webhookController.deleteWebhook);

module.exports = router;