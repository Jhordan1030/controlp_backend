const { Auditoria, Administrador, Estudiante } = require('../models');
const { validationResult } = require('express-validator');

// Función auxiliar para registrar auditoría manualmente si se requiere desde otros controladores
const registrarAuditoria = async (req, accion, tabla, registroId, detalles = null) => {
    try {
        const usuarioId = req.user ? req.user.id : null;
        const usuarioTipo = req.user ? req.user.tipo : null;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        await Auditoria.create({
            usuario_id: usuarioId,
            usuario_tipo: usuarioTipo,
            accion,
            tabla_afectada: tabla,
            registro_id: registroId,
            detalles,
            ip_address: ip,
            user_agent: req.headers['user-agent']
        });
        console.log(`📝 Auditoría registrada: ${accion} en ${tabla}`);
    } catch (error) {
        console.error('❌ Error registrando auditoría:', error.message);
    }
};

const auditController = {
    // Obtener todos los registros de auditoría (Solo Admin)
    getAll: async (req, res) => {
        try {
            // Paginación
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            // Filtros (opcional)
            const where = {};
            if (req.query.usuario_tipo) where.usuario_tipo = req.query.usuario_tipo;
            if (req.query.accion) where.accion = req.query.accion;

            const { count, rows } = await Auditoria.findAndCountAll({
                where,
                limit,
                offset,
                order: [['created_at', 'DESC']]
            });

            // Enriquecer datos con nombres de usuarios (opcional, costoso si son muchos)
            // Se podría hacer con includes si hubiera relaciones definidas, pero aquí lo haremos manual o simple

            res.json({
                success: true,
                data: rows,
                pagination: {
                    total: count,
                    page,
                    pages: Math.ceil(count / limit)
                }
            });

        } catch (error) {
            console.error('❌ Error obteniendo auditoría:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener registros de auditoría'
            });
        }
    },

    // Registrar acción (Middleware o utilidad)
    logAction: registrarAuditoria
};

module.exports = auditController;
