const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
//const { isAdminOrManager } = require('../middleware/admin.middleware');
const { isAdminOrManager, isAdmin } = require('../middleware/admin.middleware');

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ⚠️ IMPORTANT : Les routes spécifiques DOIVENT être AVANT les routes avec paramètres (:id)
// NOUVELLE ROUTE : Toutes les tâches (Admin uniquement)
router.get('/tasks/all', isAdmin, taskController.getAllTasks);
// Route pour les tâches en attente d'approbation (spécifique)
router.get('/tasks/pending-approval', taskController.getPendingApprovalTasks);

// Route pour mes tâches assignées
router.get('/my-tasks', taskController.getMyTasks);

// Routes des tâches par projet
router.get('/projects/:projectId/tasks', taskController.getTasksByProject);
router.post('/projects/:projectId/tasks', isAdminOrManager, taskController.createTask);

// Routes des tâches individuelles avec paramètre :id (DOIT ÊTRE APRÈS les routes spécifiques)
router.get('/tasks/:id', taskController.getTaskById);
router.put('/tasks/:id', isAdminOrManager, taskController.updateTask);
router.delete('/tasks/:id', isAdminOrManager, taskController.deleteTask);

// Route pour modifier le statut
router.patch('/tasks/:id/status', taskController.updateTaskStatus);

module.exports = router;