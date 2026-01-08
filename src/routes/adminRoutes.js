// ==================== src/routes/adminRoutes.js ====================
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y ser admin
router.use(authenticateToken);
router.use(isAdmin);

// DASHBOARD
router.get('/dashboard', adminController.dashboard);

// UNIVERSIDADES
router.get('/universidades', adminController.listarUniversidades);
router.post('/universidades', adminController.crearUniversidad);

// PERIODOS
router.get('/periodos', adminController.listarPeriodos);
router.post('/periodos', adminController.crearPeriodo);

// ESTUDIANTES
router.get('/estudiantes', adminController.listarEstudiantes);
router.get('/estudiantes/:id', adminController.obtenerEstudiante);
router.post('/estudiantes', adminController.crearEstudiante);
router.put('/estudiantes/:id', adminController.actualizarEstudiante);

module.exports = router;