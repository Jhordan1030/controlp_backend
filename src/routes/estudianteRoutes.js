// ==================== src/routes/estudianteRoutes.js ====================
const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const { authenticateToken, isEstudiante } = require('../middlewares/auth');

// Todas las rutas requieren ser estudiante
router.use(authenticateToken);
router.use(isEstudiante);

// PERFIL Y DASHBOARD
router.get('/perfil', estudianteController.perfil);
router.get('/dashboard', estudianteController.dashboard);

// REGISTROS DE HORAS
router.post('/registrar-horas', estudianteController.registrarHoras);
router.get('/registros', estudianteController.verRegistros);
router.put('/registros/:id', estudianteController.actualizarRegistro);
router.delete('/registros/:id', estudianteController.eliminarRegistro);

module.exports = router;