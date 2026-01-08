const express = require('express');
const router = express.Router();
const {
    login,
    registroPrimerAdmin,
    registroEstudiante,
    crearAdmin
} = require('../controllers/authController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// PUBLICOS (sin autenticación)
router.post('/login', login);
router.post('/primer-admin', registroPrimerAdmin);
router.post('/registro', registroEstudiante);

// PROTEGIDOS (requieren autenticación)
router.post('/crear-admin', authenticateToken, isAdmin, crearAdmin);

module.exports = router;