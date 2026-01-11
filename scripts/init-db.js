// scripts/init-db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const schemaPath = path.join(__dirname, '../src/database/schema.sql');

async function initializeDatabase() {
    console.log('🚀 Iniciando script de inicialización de base de datos...');

    if (!process.env.DATABASE_URL) {
        console.error('❌ Error: DATABASE_URL no está definida en las variables de entorno.');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Conectando a la base de datos...');
        await client.connect();
        console.log('✅ Conexión exitosa.');

        console.log('📖 Leyendo archivo schema.sql...');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('⚙️ Ejecutando sentencias SQL...');
        // Dividir por ; si se prefiere ejecución paso a paso, pero pg soporta strings largos
        await client.query(sql);

        console.log('✅ ¡Base de datos inicializada correctamente!');
        console.log('📋 Las tablas han sido creadas según el esquema.');

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
    } finally {
        await client.end();
        console.log('👋 Conexión cerrada.');
    }
}

initializeDatabase();
