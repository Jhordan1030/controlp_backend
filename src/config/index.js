// src/database/index.js - VERSIÓN ULTRA COMPATIBLE
console.log('🔧 Inicializando conexión a base de datos...');

// Variable para almacenar la instancia
let sequelizeInstance = null;

const initializeDatabase = () => {
  if (sequelizeInstance) {
    return sequelizeInstance;
  }

  try {
    // 1. Intentar cargar Sequelize
    const { Sequelize } = require('sequelize');
    console.log('✅ Sequelize cargado');
    
    // 2. Verificar si estamos en Vercel
    const isVercel = process.env.VERCEL === '1';
    
    if (isVercel) {
      console.log('🌍 Entorno: Vercel Production');
    }
    
    // 3. Si no hay DATABASE_URL en Vercel, usar dummy inmediatamente
    if (isVercel && !process.env.DATABASE_URL) {
      console.warn('⚠️  Vercel sin DATABASE_URL - usando modo dummy');
      sequelizeInstance = createDummyConnection();
      return sequelizeInstance;
    }
    
    // 4. Crear conexión REAL con configuraciones ultra seguras
    const connectionConfig = process.env.DATABASE_URL 
      ? {
          // Para conexión por URL (Vercel/Supabase)
          connectionString: process.env.DATABASE_URL,
          dialect: 'postgres',
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          }
        }
      : {
          // Para variables individuales (desarrollo)
          database: process.env.DB_NAME,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          dialect: 'postgres',
          dialectOptions: process.env.DB_SSL === 'true' ? {
            ssl: {
              require: true,
              rejectUnauthorized: false
            }
          } : {}
        };
    
    // 5. Crear instancia con manejo de errores
    sequelizeInstance = new Sequelize(connectionConfig);
    
    // 6. Configurar pool mínimo para Vercel
    sequelizeInstance.options.pool = {
      max: 2,
      min: 0,
      acquire: 10000,
      idle: 5000
    };
    
    console.log('✅ Instancia Sequelize creada');
    
    // 7. Intentar autenticar (pero no bloquear si falla)
    sequelizeInstance.authenticate()
      .then(() => console.log('✅ Autenticación exitosa'))
      .catch(err => {
        console.warn('⚠️  No se pudo autenticar:', err.message);
        console.log('⚠️  Continuando en modo limitado...');
      });
    
    return sequelizeInstance;
    
  } catch (error) {
    console.error('❌ ERROR CRÍTICO inicializando DB:', error.message);
    
    // Extraer información útil del error
    if (error.message.includes('install pg package')) {
      console.error('📌 PROBLEMA: El paquete pg no está disponible en Vercel');
      console.error('📌 SOLUCIÓN: Usar --no-optional al instalar');
    }
    
    // Usar conexión dummy como fallback
    sequelizeInstance = createDummyConnection();
    return sequelizeInstance;
  }
};

// Función para crear conexión dummy
function createDummyConnection() {
  console.log('🔄 Creando conexión dummy...');
  
  const dummy = {
    // Métodos básicos
    authenticate: () => Promise.reject(new Error('Base de datos no disponible en Vercel')),
    query: (sql, options) => {
      console.log(`📝 Query dummy: ${typeof sql === 'string' ? sql.substring(0, 50) + '...' : 'SQL'}`);
      return Promise.resolve([[], {}]);
    },
    sync: (options) => {
      console.log('🔄 Sync dummy ejecutada');
      return Promise.resolve();
    },
    close: () => Promise.resolve(),
    
    // Para definir modelos
    define: (name, attributes, options) => {
      console.log(`📋 Modelo dummy: ${name}`);
      const model = {
        name,
        init: () => {},
        findAll: (options) => {
          console.log(`🔍 findAll dummy en ${name}`);
          return Promise.resolve([]);
        },
        findOne: (options) => {
          console.log(`🔍 findOne dummy en ${name}`);
          return Promise.resolve(null);
        },
        create: (data, options) => {
          console.log(`➕ create dummy en ${name}`);
          return Promise.resolve({ id: Date.now(), ...data });
        },
        update: (values, options) => {
          console.log(`✏️ update dummy en ${name}`);
          return Promise.resolve([0]);
        },
        destroy: (options) => {
          console.log(`🗑️ destroy dummy en ${name}`);
          return Promise.resolve(0);
        }
      };
      return model;
    }
  };
  
  return dummy;
}

// Exportar la función de inicialización
module.exports = initializeDatabase();