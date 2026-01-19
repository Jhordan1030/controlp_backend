const { SolicitudDemo } = require('../models');

const publicController = {
    createLead: async (req, res) => {
        try {
            const { nombre, codigo_pais, telefono } = req.body;

            // 1. Validación básica
            if (!nombre || !codigo_pais || !telefono) {
                return res.status(400).json({
                    success: false,
                    error: 'Faltan datos requeridos (nombre, codigo_pais, telefono)'
                });
            }

            // 2. Insertar en Base de Datos
            const nuevoLead = await SolicitudDemo.create({
                nombre_completo: nombre,
                codigo_pais,
                telefono,
                // Fix: Ajuste manual a hora Ecuador (UTC-5) para garantizar la fecha correcta
                fecha_solicitud: new Date(new Date().getTime() - (5 * 60 * 60 * 1000)),
                estado: 'pendiente'
            });

            console.log('🕒 DEBUG TIMEZONE - Calculated:', new Date(new Date().getTime() - (5 * 60 * 60 * 1000)));
            console.log('🕒 DEBUG TIMEZONE - Saved:', nuevoLead.fecha_solicitud);

            // Log de éxito (opcional)
            console.log('✨ Nuevo Lead Registrado:', {
                id: nuevoLead.id,
                nombre: nuevoLead.nombre_completo
            });

            return res.status(201).json({
                success: true,
                message: 'Solicitud recibida correctamente',
                leadId: nuevoLead.id
            });

        } catch (error) {
            console.error('❌ Error al crear lead:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno del servidor al procesar la solicitud'
            });
        }
    }
};

module.exports = publicController;
