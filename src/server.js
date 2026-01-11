// src/server.js
require('dotenv').config();
const app = require('./app');

// Importar configuración de base de datos
// Nota: Usamos require('./database') si queremos la instancia directa,
// o require('./models') si queremos sincronización
const { sequelize } = require('./models');
const { syncDatabase } = require('./models'); // Asegúrate que tu models/index.js exporte esto

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Función para iniciar el servidor
const startServer = async () => {
    try {
        console.log('🔌 Conectando a PostgreSQL...');

        // Verificar conexión (Robustez para Vercel)
        try {
            await sequelize.authenticate();
            console.log('✅ Conexión a PostgreSQL establecida');

            // Probar consulta simple para asegurar operatividad
            // await sequelize.query('SELECT 1'); // Opcional

            // Sincronizar modelos (solo en desarrollo o si se requiere explícitamente)
            if (NODE_ENV === 'development') {
                // Si tienes una función syncDatabase segura, úsala
                if (typeof syncDatabase === 'function') {
                    await syncDatabase();
                }
            }
        } catch (dbError) {
            console.warn('⚠️  Advertencia: No se pudo conectar a la base de datos completa.');
            console.warn(`   Error: ${dbError.message}`);
            console.warn('   El servidor iniciará en modo limitado.');
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
            console.log(`   POST   http://localhost:${PORT}/api/v1/auth/registro-estudiante`);
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
        console.log(`     createdb ${process.env.DB_NAME || 'control_practicas'}`);
        console.log('4. ✓ Verifica el firewall/puertos');
        console.log('\n──────────────────────────────────────────────────\n');

        // En desarrollo salimos, en prod intentamos seguir (o no, dependiendo de la severidad)
        if (NODE_ENV === 'development') process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // process.exit(1); // Opcional: no matar el proceso en prod
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    // process.exit(1);
});

// Iniciar el servidor
startServer();