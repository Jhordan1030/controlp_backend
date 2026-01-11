// src/database/index.js
require('dotenv').config();

console.log('🔧 Inicializando conexión a base de datos...');

const { Sequelize } = require('sequelize');

// Variable para almacenar la instancia
let sequelizeInstance = null;

const initializeDatabase = () => {
  if (sequelizeInstance) {
    return sequelizeInstance;
  }

  try {
    const isVercel = process.env.VERCEL === '1';
    console.log(isVercel ? '🌍 Entorno: Vercel' : '💻 Entorno: Local');
    
    // Si no hay DATABASE_URL, usar dummy
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  No DATABASE_URL - usando modo dummy');
      sequelizeInstance = createDummyConnection();
      return sequelizeInstance;
    }
    
    // Crear conexión REAL usando la URL directamente
    sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: isVercel ? 2 : 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      logging: isVercel ? false : console.log
    });
    
    console.log('✅ Instancia Sequelize creada');
    
    // Autenticar de forma asíncrona sin bloquear
    sequelizeInstance.authenticate()
      .then(() => console.log('✅ Conexión DB exitosa'))
      .catch(err => {
        console.error('❌ Error de autenticación:', err.message);
      });
    
    return sequelizeInstance;
    
  } catch (error) {
    console.error('❌ ERROR inicializando DB:', error.message);
    sequelizeInstance = createDummyConnection();
    return sequelizeInstance;
  }
};

// Función para crear conexión dummy (fallback)
function createDummyConnection() {
  console.log('🔄 Creando conexión dummy...');
  
  return {
    authenticate: () => Promise.reject(new Error('DB no disponible')),
    query: () => Promise.resolve([[], {}]),
    sync: () => Promise.resolve(),
    close: () => Promise.resolve(),
    define: (name) => {
      console.log(`📋 Modelo dummy: ${name}`);
      return {
        name,
        findAll: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        create: (data) => Promise.resolve({ id: Date.now(), ...data }),
        update: () => Promise.resolve([0]),
        destroy: () => Promise.resolve(0)
      };
    }
  };
}

module.exports = initializeDatabase();