const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Ruta: POST /api/v1/public/create-lead
// Acceso: Público (Sin token JWT)
router.post('/create-lead', publicController.createLead);

module.exports = router;
