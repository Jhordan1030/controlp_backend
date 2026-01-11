// src/database/index.js - VERSIÓN PARA VERCEL CON MANEJO DE ERRORES
console.log('🔄 Inicializando conexión a base de datos...');

try {
  // Intentar cargar sequelize y pg
  const { Sequelize } = require('sequelize');
  
  console.log('📦 Sequelize cargado correctamente');
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NO configurada');
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'development');
  
  // Si no hay DATABASE_URL, usar dummy
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  ADVERTENCIA: DATABASE_URL no está configurada');
    console.warn('   La aplicación funcionará en modo sin base de datos');
    
    const dummySequelize = {
      authenticate: () => Promise.reject(new Error('DATABASE_URL no configurada')),
      query: (sql, options) => {
        console.log(`📝 Query dummy ejecutada: ${sql.substring(0, 50)}...`);
        return Promise.resolve([[], { rows: [] }]);
      },
      sync: (options) => {
        console.log('🔄 Sync dummy ejecutada');
        return Promise.resolve();
      },
      define: (name, attributes, options) => {
        console.log(`📋 Modelo dummy creado: ${name}`);
        return {
          name,
          findAll: () => Promise.resolve([]),
          findOne: () => Promise.resolve(null),
          create: (data) => Promise.resolve({ id: Date.now(), ...data }),
          update: () => Promise.resolve([0]),
          destroy: () => Promise.resolve(0)
        };
      },
      close: () => Promise.resolve()
    };
    
    module.exports = dummySequelize;
    console.log('✅ Dummy Sequelize exportado');
    return;
  }
  
  // CONFIGURACIÓN PARA VERCEL (PostgreSQL con SSL)
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: (msg) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 SQL: ${msg.substring(0, 100)}...`);
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000
    }
  });
  
  // Verificar conexión (pero no bloquear)
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Conexión a PostgreSQL establecida correctamente');
    })
    .catch(err => {
      console.error('❌ Error al conectar a PostgreSQL:', err.message);
      console.log('⚠️  La aplicación continuará en modo limitado');
    });
  
  module.exports = sequelize;
  console.log('✅ Sequelize real exportado');
  
} catch (error) {
  console.error('❌ ERROR CRÍTICO al inicializar base de datos:', error.message);
  console.error('Stack:', error.stack);
  
  // Exportar dummy en caso de error catastrófico
  const errorSequelize = {
    authenticate: () => Promise.reject(error),
    query: () => Promise.resolve([[], {}]),
    sync: () => Promise.resolve(),
    define: () => ({
      findAll: () => Promise.resolve([]),
      findOne: () => Promise.resolve(null)
    }),
    close: () => Promise.resolve()
  };
  
  module.exports = errorSequelize;
  console.log('⚠️  Exportando Sequelize de emergencia');
}