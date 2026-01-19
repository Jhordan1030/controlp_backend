const { SolicitudDemo } = require('../models');

const adminLeadsController = {
    // Listar todos los leads
    getAllLeads: async (req, res) => {
        try {
            const leads = await SolicitudDemo.findAll({
                order: [['fecha_solicitud', 'DESC']]
            });

            res.json(leads);
        } catch (error) {
            console.error('❌ Error al obtener leads:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener los leads'
            });
        }
    },

    // Actualizar estado de un lead
    updateLeadStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            const lead = await SolicitudDemo.findByPk(id);

            if (!lead) {
                return res.status(404).json({
                    success: false,
                    error: 'Lead no encontrado'
                });
            }

            if (estado === 'contactado') {
                await lead.destroy();
                console.log(`✅ Lead ID ${id} eliminado por cambio a estado: contactado`);
                return res.json({
                    success: true,
                    message: 'Lead contactado y eliminado del registro'
                });
            }

            await lead.update({ estado });

            console.log(`✅ Lead ID ${id} actualizado a estado: ${estado}`);

            res.json({
                success: true,
                message: 'Estado actualizado correctamente'
            });
        } catch (error) {
            console.error('❌ Error al actualizar lead:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar el estado del lead'
            });
        }
    }
};

module.exports = adminLeadsController;
