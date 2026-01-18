const { Op } = require('sequelize');
const { Periodo } = require('../models');
const { clearAllCache } = require('../middlewares/cache');

const periodoService = {
    verificarYDesactivarVencidos: async () => {
        try {
            console.log('🕒 [Service] Verificando periodos vencidos...');

            // Queremos: fecha_fin < HOY (comienzo del día o momento actual)
            // Lógica: Si fecha_fin es ayer (2024-01-17) y hoy es (2024-01-18), 17 < 18 => Vencido.

            const [affectedRows] = await Periodo.update(
                { activo: false },
                {
                    where: {
                        activo: true,
                        fecha_fin: {
                            [Op.lt]: new Date()
                        }
                    }
                }
            );

            if (affectedRows > 0) {
                console.log(`✅ [Service] Se desactivaron ${affectedRows} periodos vencidos.`);
                clearAllCache(); // Invalidad caché global
            } else {
                console.log('ℹ️ [Service] No se encontraron periodos por vencer.');
            }

            return {
                success: true,
                count: affectedRows
            };

        } catch (error) {
            console.error('❌ [Service] Error desactivando periodos:', error);
            throw error;
        }
    }
};

module.exports = periodoService;
