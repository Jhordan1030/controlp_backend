// ==================== src/server.js ====================
require('dotenv').config();
const app = require('./app');

// Importar desde models/index.js
const { sequelize, syncDatabase } = require('./models');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Función para iniciar el servidor
const startServer = async () => {
    try {
        console.log('🔌 Conectando a PostgreSQL...');
        
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

        // Iniciar servidor HTTP
        app.listen(PORT, () => {
            console.log('\n╔════════════════════════════════════════════════╗');
            console.log('║   SERVIDOR INICIADO CORRECTAMENTE             ║');
            console.log('╚════════════════════════════════════════════════╝\n');
            console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
            console.log(`🌍 Entorno: ${NODE_ENV}`);
            console.log(`📅 Fecha: ${new Date().toLocaleString('es-EC')}`);
            console.log('\n📋 ENDPOINTS PRINCIPALES:\n');
            console.log('   AUTH:');
            console.log(`   POST   http://localhost:${PORT}/api/v1/auth/login`);
            console.log(`   POST   http://localhost:${PORT}/api/v1/auth/primer-admin`);
            console.log(`   POST   http://localhost:${PORT}/api/v1/auth/registro`);
            console.log('\n   ADMIN:');
            console.log(`   GET    http://localhost:${PORT}/api/v1/admin/dashboard`);
            console.log(`   GET    http://localhost:${PORT}/api/v1/admin/universidades`);
            console.log(`   POST   http://localhost:${PORT}/api/v1/admin/universidades`);
            console.log(`   PUT    http://localhost:${PORT}/api/v1/admin/universidades/:id/toggle`);
            console.log(`   GET    http://localhost:${PORT}/api/v1/admin/periodos`);
            console.log(`   POST   http://localhost:${PORT}/api/v1/admin/periodos`);
            console.log(`   PUT    http://localhost:${PORT}/api/v1/admin/periodos/:id/toggle`);
            console.log(`   GET    http://localhost:${PORT}/api/v1/admin/estudiantes`);
            console.log(`   POST   http://localhost:${PORT}/api/v1/admin/estudiantes`);
            console.log(`   PUT    http://localhost:${PORT}/api/v1/admin/estudiantes/:id/toggle`);
            console.log('\n   ESTUDIANTE:');
            console.log(`   GET    http://localhost:${PORT}/api/v1/estudiante/dashboard`);
            console.log(`   POST   http://localhost:${PORT}/api/v1/estudiante/registrar-horas`);
            console.log(`   GET    http://localhost:${PORT}/api/v1/estudiante/registros`);
            console.log('\n   SALUD:');
            console.log(`   GET    http://localhost:${PORT}/api/v1/health`);
            console.log('\n🔧 COMANDOS ÚTILES:\n');
            console.log('   npm run dev     → Modo desarrollo (con nodemon)');
            console.log('   npm run seed    → Crear datos de prueba');
            console.log('   npm run reset   → Reiniciar base de datos (solo desarrollo)');
            console.log('\n💡 PRIMER PASO:\n');
            console.log('   Ejecuta: npm run seed');
            console.log('   O crea el primer admin en: POST /api/v1/auth/primer-admin');
            console.log('\n──────────────────────────────────────────────────\n');
        });

    } catch (error) {
        console.error('\n❌ ERROR AL INICIAR EL SERVIDOR:\n');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);

        console.log('\n🔧 SOLUCIÓN DE PROBLEMAS:\n');
        console.log('1. ✓ Verifica que PostgreSQL esté corriendo');
        console.log('2. ✓ Verifica las credenciales en el archivo .env');
        console.log('3. ✓ Verifica que la base de datos exista:');
        console.log(`     createdb ${process.env.DB_NAME}`);
        console.log('4. ✓ Verifica el firewall/puertos');
        console.log('\n──────────────────────────────────────────────────\n');

        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recibido. Cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 SIGINT recibido. Cerrando servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();