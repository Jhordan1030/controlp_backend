const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { validateLogin, validateRegistroEstudiante, validateRegistroAdmin } = require('../validators/authValidator');

// Rutas públicas
router.post('/login', validateLogin, authController.login);
router.post('/primer-admin', validateRegistroAdmin, authController.registroPrimerAdmin);
router.post('/registro-estudiante', validateRegistroEstudiante, authController.registroEstudiante);

// Rutas protegidas
router.post('/crear-admin', authenticateToken, validateRegistroAdmin, authController.crearAdmin); // Solo admins (validado en controlador o middleware extra si se desea)

// PERFIL (Usuario autenticado)
router.get('/perfil', authenticateToken, authController.perfil);
router.put('/perfil', authenticateToken, authController.actualizarPerfil);

// LOGOUT
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;