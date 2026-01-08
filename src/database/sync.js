require('dotenv').config();
const { sequelize, syncDatabase } = require('./index');

async function runSync() {
    try {
        console.log('🔄 Sincronizando base de datos...');

        // false = no borrar datos existentes, solo crear tablas faltantes
        // true = borrar y recrear todo (¡CUIDADO en producción!)
        const forceSync = process.argv.includes('--force');

        if (forceSync) {
            console.log('⚠️  MODO FORCE HABILITADO - Se borrarán todos los datos existentes!');
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            await new Promise((resolve) => {
                readline.question('¿Continuar? (yes/no): ', (answer) => {
                    readline.close();
                    if (answer.toLowerCase() === 'yes') {
                        resolve();
                    } else {
                        console.log('❌ Operación cancelada');
                        process.exit(0);
                    }
                });
            });
        }

        const success = await syncDatabase(forceSync);

        if (success) {
            console.log('✅ Base de datos sincronizada exitosamente');

            // Mostrar información de las tablas
            const [tables] = await sequelize.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);

            console.log('\n📊 Tablas en la base de datos:');
            tables.forEach(table => {
                console.log(`   📁 ${table.table_name} (${table.column_count} columnas)`);
            });

        } else {
            console.log('❌ Error sincronizando base de datos');
        }

        await sequelize.close();
        process.exit(success ? 0 : 1);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

runSync();