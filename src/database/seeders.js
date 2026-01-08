require('dotenv').config();
const bcrypt = require('bcrypt');
const {
    Universidad,
    Periodo,
    Estudiante,
    Administrador,
    RegistroHora,
    sequelize
} = require('./index');

async function seedDatabase() {
    const transaction = await sequelize.transaction();

    try {
        console.log('🌱 Iniciando seeders...');

        // Verificar si ya existen datos
        const adminCount = await Administrador.count({ transaction });

        if (adminCount > 0) {
            console.log('⚠️  Ya existen datos en la base de datos. Saltando seeders.');
            await transaction.rollback();
            return;
        }

        // 1. Crear administrador
        console.log('👤 Creando administrador...');
        const adminPassword = await bcrypt.hash('Admin123!', 12);
        const admin = await Administrador.create({
            nombres: 'Administrador Principal',
            email: 'admin@controlpracticas.com',
            password_hash: adminPassword,
            super_admin: true,
            activo: true
        }, { transaction });
        console.log(`✅ Administrador creado: ${admin.email}`);

        // 2. Crear universidad
        console.log('🏛️  Creando universidad...');
        const universidad = await Universidad.create({
            nombre: 'Universidad Nacional de Prueba',
            activa: true
        }, { transaction });
        console.log(`✅ Universidad creada: ${universidad.nombre}`);

        // 3. Crear periodo
        console.log('📅 Creando periodo...');
        const periodo = await Periodo.create({
            universidad_id: universidad.id,
            nombre: '2024-I',
            fecha_inicio: '2024-01-15',
            fecha_fin: '2024-07-15',
            horas_totales_requeridas: 240,
            activo: true
        }, { transaction });
        console.log(`✅ Periodo creado: ${periodo.nombre} (${periodo.horas_totales_requeridas} horas)`);

        // 4. Crear estudiante
        console.log('👨‍🎓 Creando estudiante...');
        const estudiantePassword = await bcrypt.hash('Estudiante123!', 12);
        const estudiante = await Estudiante.create({
            nombres: 'Juan',
            apellidos: 'Pérez',
            email: 'juan.perez@ejemplo.com',
            password_hash: estudiantePassword,
            universidad_id: universidad.id,
            periodo_id: periodo.id,
            activo: true
        }, { transaction });
        console.log(`✅ Estudiante creado: ${estudiante.nombres} ${estudiante.apellidos} (${estudiante.email})`);

        // 5. Crear más estudiantes
        console.log('👨‍🎓 Creando más estudiantes...');
        const estudiantesData = [
            {
                nombres: 'María',
                apellidos: 'García',
                email: 'maria.garcia@ejemplo.com',
                password: 'Estudiante123!',
                universidad_id: universidad.id,
                periodo_id: periodo.id
            },
            {
                nombres: 'Carlos',
                apellidos: 'López',
                email: 'carlos.lopez@ejemplo.com',
                password: 'Estudiante123!',
                universidad_id: universidad.id,
                periodo_id: periodo.id
            },
            {
                nombres: 'Ana',
                apellidos: 'Martínez',
                email: 'ana.martinez@ejemplo.com',
                password: 'Estudiante123!',
                universidad_id: universidad.id,
                periodo_id: periodo.id
            }
        ];

        for (const estudianteData of estudiantesData) {
            const passwordHash = await bcrypt.hash(estudianteData.password, 12);
            await Estudiante.create({
                nombres: estudianteData.nombres,
                apellidos: estudianteData.apellidos,
                email: estudianteData.email,
                password_hash: passwordHash,
                universidad_id: estudianteData.universidad_id,
                periodo_id: estudianteData.periodo_id,
                activo: true
            }, { transaction });
            console.log(`   ✓ ${estudianteData.nombres} ${estudianteData.apellidos}`);
        }

        // 6. Crear registros de horas de ejemplo
        console.log('⏱️  Creando registros de horas...');

        // Registros para Juan Pérez
        const registrosJuan = [
            { fecha: '2024-01-16', horas: 8, descripcion: 'Primer día - Orientación y capacitación inicial' },
            { fecha: '2024-01-17', horas: 7.5, descripcion: 'Revisión de procesos y documentación' },
            { fecha: '2024-01-18', horas: 6, descripcion: 'Capacitación en herramientas de desarrollo' },
            { fecha: '2024-01-19', horas: 8, descripcion: 'Desarrollo de módulo de autenticación' },
            { fecha: '2024-01-22', horas: 7, descripcion: 'Pruebas unitarias y documentación' }
        ];

        for (const registro of registrosJuan) {
            await RegistroHora.create({
                estudiante_id: estudiante.id,
                fecha: registro.fecha,
                horas: registro.horas,
                descripcion: registro.descripcion
            }, { transaction });
        }
        console.log(`   ✓ 5 registros para Juan Pérez (Total: ${registrosJuan.reduce((sum, r) => sum + r.horas, 0)} horas)`);

        // Confirmar transacción
        await transaction.commit();

        console.log('\n✨ Seeders completados exitosamente!');
        console.log('\n📋 Datos creados:');
        console.log('👤 Administrador:');
        console.log('   - admin@controlpracticas.com / Admin123!');
        console.log('\n🏛️  Universidad:');
        console.log('   - Universidad Nacional de Prueba');
        console.log('\n📅 Periodo:');
        console.log('   - 2024-I (240 horas requeridas)');
        console.log('\n👨‍🎓 Estudiantes (password: Estudiante123!):');
        console.log('   1. Juan Pérez - juan.perez@ejemplo.com');
        console.log('   2. María García - maria.garcia@ejemplo.com');
        console.log('   3. Carlos López - carlos.lopez@ejemplo.com');
        console.log('   4. Ana Martínez - ana.martinez@ejemplo.com');
        console.log('\n⏱️  Registros de horas:');
        console.log('   - 5 registros de ejemplo para Juan Pérez');

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en seeders:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Si el archivo se ejecuta directamente
if (require.main === module) {
    seedDatabase()
        .then(() => {
            console.log('\n✅ Proceso completado');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = seedDatabase;