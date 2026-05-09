const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/jwtMiddleware');
const { createTaskSchema, updateTaskSchema } = require('../validations/taskSchema');
const validate = require('../middleware/validationMiddleware');

router.use(protect)

router.route('/')
    .get(taskController.getAllTasks) 
    .post(validate(createTaskSchema),taskController.createTask);   

router.route('/:id')
    .get(taskController.getTask)      
    .patch(validate(updateTaskSchema),taskController.updateTask)   
    .delete(taskController.deleteTask); 


module.exports = router;