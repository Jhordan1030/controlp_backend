require('dotenv').config();
const app = require('./app');
const sequelize = require('./database');

const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        console.log('🔌 Conectando a Supabase...');
        await sequelize.authenticate();
        console.log('✅ Conectado a Supabase');

        // Probar consulta simple
        await sequelize.query('SELECT 1');
        console.log('✅ Base de datos accesible');

        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en: http://localhost:${PORT}`);
            console.log('📋 Endpoints disponibles:');
            console.log('   POST /api/v1/auth/primer-admin → Crear primer administrador');
            console.log('   POST /api/v1/auth/login        → Login (admin o estudiante)');
            console.log('   POST /api/v1/auth/registro     → Registro estudiante');
            console.log('   GET  /api/v1/health            → Verificar estado del servidor');
            console.log('\n🔧 Para crear el primer administrador:');
            console.log('   curl -X POST http://localhost:3000/api/v1/auth/primer-admin \\');
            console.log('     -H "Content-Type: application/json" \\');
            console.log('     -d \'{"nombres":"Admin","email":"admin@ejemplo.com","password":"Admin123!"}\'');
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        console.log('\n🔧 Solución de problemas:');
        console.log('1. Verifica que Supabase esté activo');
        console.log('2. Verifica las credenciales en .env');
        console.log('3. Verifica que las tablas existan en Supabase');
        process.exit(1);
    }
};

// Iniciar el servidor
startServer();