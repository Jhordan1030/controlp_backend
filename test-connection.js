require('dotenv').config({ path: '.env' });
const { Sequelize } = require('sequelize');

console.log('🔍 Verificando configuración...');
console.log('Host:', process.env.DB_HOST);
console.log('Puerto:', process.env.DB_PORT);
console.log('Usuario:', process.env.DB_USER);
console.log('Base de datos:', process.env.DB_NAME);
console.log('SSL:', process.env.DB_SSL);

// Construir URL de conexión (sin password por seguridad)
const connectionString = `postgresql://${process.env.DB_USER}:[PASSWORD]@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
console.log('\n📡 URL de conexión (sin password):');
console.log(connectionString);

// Crear instancia de Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: {
            ssl: process.env.DB_SSL === 'true' ? {
                require: true,
                rejectUnauthorized: false
            } : false
        },
        logging: console.log,
        retry: {
            max: 3,
            timeout: 5000
        }
    }
);

async function testConnection() {
    try {
        console.log('\n🔄 Intentando conectar a Supabase...');

        await sequelize.authenticate();
        console.log('✅ ¡Conexión exitosa a Supabase!');

        // Probar consulta simple
        console.log('\n📊 Consultando información del servidor...');
        const [result] = await sequelize.query('SELECT version(), current_database(), current_user;');

        console.log('Información del servidor:');
        console.log('- Base de datos:', result[0].current_database);
        console.log('- Usuario:', result[0].current_user);
        console.log('- Versión PostgreSQL:', result[0].version.split(',')[0]);

        // Listar tablas
        console.log('\n🔍 Buscando tablas existentes...');
        const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        if (tables.length > 0) {
            console.log('Tablas encontradas:');
            tables.forEach((row, i) => {
                console.log(`  ${i + 1}. ${row.table_name}`);
            });
        } else {
            console.log('⚠️ No se encontraron tablas. Necesitas crear las tablas primero.');
        }

        await sequelize.close();
        console.log('\n✨ Prueba completada exitosamente!');

    } catch (error) {
        console.error('\n❌ Error conectando a Supabase:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code || 'N/A');
        console.error('Detalles:', error.original?.message || error.parent?.message || 'N/A');

        console.log('\n🔧 Solución de problemas detallada:');
        console.log('1. Verifica que tu archivo .env esté en la raíz del proyecto');
        console.log('2. Verifica la contraseña en .env (sin comillas)');
        console.log('3. Asegúrate de que el usuario sea: postgres.lxgtyfxfecjsyolewzba');
        console.log('4. Verifica que el host sea: aws-1-us-east-2.pooler.supabase.com');
        console.log('5. Verifica que el puerto sea: 6543');
        console.log('6. Asegúrate de que Supabase esté activo en el dashboard');
        console.log('7. Prueba conectarte manualmente con psql:');
        console.log(`   psql "postgresql://${process.env.DB_USER}:[TU_PASSWORD]@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}"`);

        // Mostrar error completo en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log('\n📋 Error completo:');
            console.error(error);
        }
    }
}

testConnection();