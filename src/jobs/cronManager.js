const cron = require('node-cron');
const periodoService = require('../services/periodoService');

const initCronJobs = () => {
    console.log('⏰ Inicializando Cron Jobs...');

    // Tarea: Verificar periodos vencidos todos los días a las 00:01 AM
    // Formato Cron: Minuto Hora DíaMes Mes DíaSemana
    cron.schedule('1 0 * * *', async () => {
        console.log('🌙 [Cron] Ejecutando verificación nocturna de periodos...');
        try {
            await periodoService.verificarYDesactivarVencidos();
        } catch (error) {
            console.error('❌ [Cron] Falló la verificación nocturna:', error);
        }
    });

    console.log('✅ Cron Jobs programados: [00:01 AM] Verificación de Periodos');
};

module.exports = { initCronJobs };
