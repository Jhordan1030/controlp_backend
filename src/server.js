// ==================== src/server.js ====================
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Función para iniciar el servidor
const startServer = async () => {
    try {
        console.log('🚀 Iniciando servidor...');
        console.log(`🌍 Entorno: ${NODE_ENV}`);
        console.log(`📅 Fecha: ${new Date().toLocaleString('es-EC')}`);

        // CONEXIÓN A BASE DE DATOS (CON MANEJO DE ERRORES)
        try {
            console.log('🔌 Intentando conectar a PostgreSQL...');
            const { sequelize, syncDatabase } = require('./models');
            
            // Verificar conexión
            await sequelize.authenticate();
            console.log('✅ Conexión a PostgreSQL establecida');

            // Probar consulta simple
            await sequelize.query('SELECT 1');
            console.log('✅ Base de datos accesible');

            // Sincronizar modelos (solo en desarrollo)
            if (NODE_ENV === 'development') {
                await syncDatabase();
            }
            
            console.log('📊 Base de datos lista');
        } catch (dbError) {
            console.warn('⚠️  ADVERTENCIA: No se pudo conectar a la base de datos');
            console.warn('   Mensaje:', dbError.message);
            console.warn('   La API funcionará en modo limitado (sin base de datos)');
            
            // Agregar información al app para endpoints de salud
            app.locals.dbStatus = 'disconnected';
            app.locals.dbError = dbError.message;
        }

        // Iniciar servidor HTTP
        const server = app.listen(PORT, () => {
            console.log('\n╔════════════════════════════════════════════════╗');
            console.log('║   SERVIDOR INICIADO CORRECTAMENTE             ║');
            console.log('╚════════════════════════════════════════════════╝\n');
            console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${NODE_ENV}`);
            
            // Mostrar estado de la base de datos
            if (app.locals.dbStatus === 'disconnected') {
                console.log('⚠️  Base de datos: DESCONECTADA (modo limitado)');
            } else {
                console.log('✅ Base de datos: CONECTADA');
            }
            
            console.log('\n📋 ENDPOINTS DISPONIBLES:\n');
            console.log('   GET    /                 → Página de inicio');
            console.log('   GET    /api/v1/health    → Estado del sistema');
            console.log('   POST   /api/v1/auth/login');
            console.log('   GET    /api/v1/admin/dashboard');
            console.log('\n💡 Para ver todos los endpoints, consulta el README');
            console.log('\n──────────────────────────────────────────────────\n');
        });

        // Manejo de cierre limpio
        const gracefulShutdown = () => {
            console.log('\n👋 Recibida señal de apagado. Cerrando servidor...');
            server.close(() => {
                console.log('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
            
            // Forzar cierre después de 10 segundos
            setTimeout(() => {
                console.error('❌ Tiempo de espera agotado. Forzando cierre...');
                process.exit(1);
            }, 10000);
        };

        // Capturar señales de terminación
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('\n❌ ERROR CRÍTICO AL INICIAR EL SERVIVIDOR:\n');
        console.error('Mensaje:', error.message);
        
        console.log('\n🔧 SOLUCIÓN DE PROBLEMAS PARA VERCEL:\n');
        console.log('1. ✓ Verifica que el paquete "pg" esté en package.json');
        console.log('2. ✓ Verifica las variables de entorno en Vercel:');
        console.log('   - NODE_ENV=production');
        console.log('3. ✓ Revisa los logs de build en Vercel');
        
        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message || err);
    // No salir en producción
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message || err);
    // No salir en producción
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Iniciar el servidor
startServer();