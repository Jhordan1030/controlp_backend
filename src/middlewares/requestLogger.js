const jwt = require('jsonwebtoken');
const auditController = require('../controllers/auditController');

const requestLogger = async (req, res, next) => {
    // 1. Intentar identificar al usuario (Soft Auth)
    if (!req.user) {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = { id: decoded.id, tipo: decoded.tipo }; // Mínima info para log
            }
        } catch (err) {
            console.log('🕵️ Audit: Error decodificando token (Soft Auth):', err.message);
        }
    }

    // 2. Interceptar finalización de la respuesta para loguear
    const start = Date.now();

    // Almacenar el original .end para interceptarlo
    // O usar on-headers / on-finished

    res.on('finish', async () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        // Ignorar OPTIONS, Health Check, y Assets estáticos para no llenar la BD
        if (req.method === 'OPTIONS') return;
        if (req.path.includes('/health')) return;
        if (req.path.includes('favicon')) return;

        // Determinar acción basada en método
        let action = 'UNKNOWN';
        if (req.method === 'GET') action = 'READ';
        if (req.method === 'POST') action = 'CREATE';
        if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
        if (req.method === 'DELETE') action = 'DELETE';

        // Detalles adicionales
        const details = {
            method: req.method,
            path: req.path,
            statusCode: statusCode,
            duration: `${duration}ms`,
            // query: req.query, // Cuidado con datos sensibles
            // body: req.body // Cuidado con passwords
        };

        // Si es login falso/exitoso ya lo logueamos en el controlador, 
        // pero aquí logueamos la "petición HTTP"
        // Para evitar duplicados en Login, podríamos poner un filtro
        if (req.path.includes('/auth/login')) return; // Auth controller ya maneja esto mejor

        try {
            await auditController.logAction(
                req,
                `HTTP_${action}`,
                'api',
                null,
                details
            );
        } catch (err) {
            console.error('Error logging request:', err.message);
        }
    });

    next();
};

module.exports = requestLogger;
