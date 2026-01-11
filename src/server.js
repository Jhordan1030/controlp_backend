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
startServer();// ==================== src/server.js ====================
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
            console.log(`📡 URL: http://localhost:${PORT}`);
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
            console.log('   GET    /api/v1/ready     → Verificar si está listo');
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
        console.error('\n❌ ERROR CRÍTICO AL INICIAR EL SERVIDOR:\n');
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack ? error.stack.substring(0, 500) : 'No hay stack trace');
        
        console.log('\n🔧 SOLUCIÓN DE PROBLEMAS PARA VERCEL:\n');
        console.log('1. ✓ Verifica que el paquete "pg" esté en package.json');
        console.log('2. ✓ Verifica las variables de entorno en Vercel:');
        console.log('   - DATABASE_URL (para PostgreSQL)');
        console.log('   - NODE_ENV=production');
        console.log('3. ✓ Revisa los logs de build en Vercel');
        console.log('4. ✓ Limpia el cache de Vercel si es necesario');
        console.log('\n📝 Variables actuales:');
        console.log('   PORT:', process.env.PORT || '3000 (default)');
        console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
        console.log('   DB_HOST:', process.env.DB_HOST || 'No configurado');
        console.log('\n──────────────────────────────────────────────────\n');

        process.exit(1);
    }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message || err);
    // No salir en producción, solo registrar
    if (process.env.NODE_ENV === 'production') {
        console.error('Continuando en producción a pesar del error...');
    } else {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message || err);
    console.error('Stack:', err.stack ? err.stack.substring(0, 500) : 'No hay stack');
    // No salir en producción
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Iniciar el servidor
startServer();