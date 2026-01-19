// src/middlewares/requestLogger.js
const logger = require('../utils/logger');
const { validate: isUuid } = require('uuid');

const requestLogger = async (req, res, next) => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Log inicial de la petición
    logger.info(`📥 [${requestId}] ${req.method} ${req.path}`, {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    // Capturar información de auditoría
    const auditData = {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        query: req.query,
        body: req.method !== 'GET' ? sanitizeBody(req.body) : null
    };

    // Interceptar la respuesta
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    res.json = function (body) {
        const duration = Date.now() - startTime;

        // Log de respuesta
        const statusColor = res.statusCode >= 400 ? '❌' : res.statusCode >= 300 ? '⚠️' : '✅';
        logger.info(`${statusColor} [${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: JSON.stringify(body).length
        });

        // Registrar auditoría en BD asíncronamente
        setTimeout(async () => {
            try {
                const { Auditoria } = require('../models');

                // Determinar tipo de usuario
                let usuarioId = null;
                let usuarioTipo = null;

                if (req.user) {
                    usuarioId = req.user.id;
                    usuarioTipo = req.user.tipo;
                }

                // Determinar acción
                const accion = determineAction(req.method, res.statusCode);
                const tabla = determineTable(req.path);

                // No registrar ciertas rutas
                if (shouldSkipAudit(req.path)) {
                    return;
                }

                await Auditoria.create({
                    usuario_id: (usuarioId && isUuid(usuarioId)) ? usuarioId : null,
                    usuario_tipo: usuarioTipo,
                    accion: accion,
                    tabla_afectada: tabla,
                    registro_id: (req.params.id && isUuid(req.params.id)) ? req.params.id : null,
                    detalles: {
                        ...auditData,
                        statusCode: res.statusCode,
                        duration: `${duration}ms`,
                        responseSize: JSON.stringify(body).length
                    },
                    ip_address: req.ip,
                    user_agent: req.headers['user-agent']
                });

                logger.debug(`📝 [${requestId}] Auditoría guardada en BD`, {
                    requestId,
                    action: accion,
                    table: tabla
                });

            } catch (error) {
                logger.error(`❌ [${requestId}] Error guardando auditoría: ${error.message}`, {
                    requestId,
                    error: error.message,
                    stack: error.stack
                });
            }
        }, 0);

        return originalJson.call(this, body);
    };

    next();
};

// Funciones auxiliares
function determineAction(method, statusCode) {
    if (statusCode >= 400) {
        return `FAILED_${method}`;
    }

    const actions = {
        'GET': 'READ',
        'POST': 'CREATE',
        'PUT': 'UPDATE',
        'PATCH': 'UPDATE',
        'DELETE': 'DELETE'
    };

    return actions[method] || method;
}

function determineTable(path) {
    const tableMap = {
        '/universidades': 'universidades',
        '/periodos': 'periodos',
        '/estudiantes': 'estudiantes',
        '/administradores': 'administradores',
        '/registros': 'registros_horas',
        '/matriculaciones': 'matriculaciones',
        '/evidencias': 'evidencias',
        '/auth': 'autenticacion',
        '/admin': 'administracion'
    };

    for (const [key, table] of Object.entries(tableMap)) {
        if (path.includes(key)) {
            return table;
        }
    }

    return 'sistema';
}

function shouldSkipAudit(path) {
    const excludedPaths = [
        '/health',
        '/favicon',
        '/api/v1/auditoria',
        '/auth/login' // Ya se registra en authController
    ];

    return excludedPaths.some(excluded => path.includes(excluded));
}

function sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...body };

    // Remover campos sensibles
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.password_hash) sanitized.password_hash = '[REDACTED]';
    if (sanitized.token) sanitized.token = '[REDACTED]';
    if (sanitized.confirmPassword) sanitized.confirmPassword = '[REDACTED]';

    return sanitized;
}

module.exports = requestLogger;