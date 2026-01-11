const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Todas las rutas requieren ser admin
router.use(isAuthenticated, isAdmin);

// GET /api/v1/auditoria
router.get('/', auditController.getAll);

module.exports = router;
