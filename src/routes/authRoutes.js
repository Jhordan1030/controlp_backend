const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// PÚBLICOS (sin autenticación)
router.post('/login', authController.login);
router.post('/primer-admin', authController.registroPrimerAdmin);
router.post('/registro', authController.registroEstudiante);

// PROTEGIDOS (requieren autenticación de admin)
router.post('/crear-admin', authenticateToken, isAdmin, authController.crearAdmin);

module.exports = router;