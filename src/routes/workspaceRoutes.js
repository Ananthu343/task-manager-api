const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');

router.route('/')
   .get(workspaceController.getWorkspaces)
   .post(workspaceController.createWorkspace)

router.route('/:id')
   .get(workspaceController.getWorkspaceById)
   .patch(workspaceController.updateWorkspace)   
   .delete(workspaceController.deleteWorkspace)

module.exports = router;
