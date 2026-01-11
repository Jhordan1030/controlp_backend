// ==================== src/server.js ====================
require('dotenv').config();

console.log('🚀 Iniciando servidor...');
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
console.log('📅 Fecha:', new Date().toLocaleString('es-EC'));
console.log('📦 Node:', process.version);

// Importar app (configuración de Express)
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('\n🔧 Configurando servidor...\n');
    
    // INTENTAR CONECTAR A BASE DE DATOS (PERO NO BLOQUEAR)
    try {
      console.log('🔄 Intentando inicializar base de datos...');
      const { initializeDatabase } = require('./models');
      const dbInitResult = await initializeDatabase();
      
      if (dbInitResult.connection) {
        console.log('✅ Base de datos: CONECTADA');
        app.locals.dbStatus = 'connected';
      } else {
        console.warn('⚠️  Base de datos: DESCONECTADA (modo limitado)');
        console.warn('   La API funcionará con funcionalidad básica');
        app.locals.dbStatus = 'disconnected';
        app.locals.dbError = dbInitResult.error;
      }
    } catch (dbError) {
      console.error('❌ Error inicializando base de datos:', dbError.message);
      console.warn('⚠️  Continuando sin base de datos...');
      app.locals.dbStatus = 'error';
      app.locals.dbError = dbError.message;
    }
    
    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║       SERVIDOR INICIADO CORRECTAMENTE         ║');
      console.log('╚════════════════════════════════════════════════╝\n');
      console.log(`🚀 Servidor ejecutándose en puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Base de datos: ${app.locals.dbStatus || 'unknown'}`);
      console.log('\n📋 ENDPOINTS DISPONIBLES:\n');
      console.log('   GET    /                 → Página de inicio');
      console.log('   GET    /health           → Estado del sistema');
      console.log('   GET    /api/v1/health    → Estado API');
      console.log('   POST   /api/v1/auth/login');
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
    
    if (error.stack) {
      const stackLines = error.stack.split('\n');
      console.error('Stack (primeras 3 líneas):');
      for (let i = 0; i < Math.min(3, stackLines.length); i++) {
        console.error('  ', stackLines[i]);
      }
    }
    
    console.log('\n🔧 DIAGNÓSTICO:\n');
    console.log('1. Verificar variables de entorno en Vercel:');
    console.log('   - NODE_ENV=production');
    console.log('   - DATABASE_URL (opcional para modo básico)');
    console.log('\n2. Verificar dependencias en package.json');
    console.log('\n3. Revisar logs de build en Vercel');
    
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message || err);
  // No salir en producción
  if (process.env.NODE_ENV !== 'production') {
    console.error('Continuando en producción...');
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message || err);
  // No salir inmediatamente en producción
  if (process.env.NODE_ENV === 'production') {
    console.error('Continuando en producción...');
  } else {
    process.exit(1);
  }
});

// Iniciar el servidor
startServer();