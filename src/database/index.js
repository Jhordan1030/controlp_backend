// src/database/index.js
require('dotenv').config();
const { Sequelize } = require('sequelize');
const pg = require('pg'); // Importar pg explícitamente para Vercel

console.log('🔧 Inicializando conexión a base de datos (src/database/index.js)...');

let sequelizeInstance = null;

function createDummyConnection() {
    console.log('🔄 Creando conexión dummy...');
    return {
        authenticate: () => Promise.reject(new Error('DB no disponible (Dummy Mode)')),
        query: () => Promise.resolve([[], { rows: [] }]),
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
                destroy: () => Promise.resolve(0),
                belongsTo: () => { },
                hasMany: () => { },
                belongsToMany: () => { }
            };
        }
    };
}

const getSequelize = () => {
    if (sequelizeInstance) {
        return sequelizeInstance;
    }

    try {
        const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
        console.log(isVercel ? '🌍 Entorno: Vercel/Production' : '💻 Entorno: Local');

        // Si no hay DATABASE_URL, usar dummy
        if (!process.env.DATABASE_URL) {
            console.warn('⚠️  No DATABASE_URL configurada - usando modo dummy');
            sequelizeInstance = createDummyConnection();
            return sequelizeInstance;
        }

        console.log('🔌 Conectando a PostgreSQL...');

        // Crear conexión REAL
        sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
            dialect: 'postgres',
            dialectModule: pg, // <--- SOLUCIÓN PARA VERCEL: Pasar el módulo explícitamente
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
            logging: isVercel ? false : console.log,
            benchmark: true
        });

        // Autenticación asíncrona (no bloqueante)
        sequelizeInstance.authenticate()
            .then(() => console.log('✅ Conexión DB establecida correctamente'))
            .catch(err => console.error('❌ Error conexión DB:', err.message));

        return sequelizeInstance;

    } catch (error) {
        console.error('❌ ERROR CRÍTICO inicializando DB:', error.message);
        sequelizeInstance = createDummyConnection();
        return sequelizeInstance;
    }
};

// Exportar la instancia directamente (Sequelize pattern)
// Al llamar a la función aquí, nos aseguramos que se cree la instancia
module.exports = getSequelize();