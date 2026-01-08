require('dotenv').config();
const bcrypt = require('bcrypt');
const {
    Universidad,
    Periodo,
    Estudiante,
    Administrador,
    RegistroHora,
    sequelize
} = require('../models');

async function seedDatabase() {
    const transaction = await sequelize.transaction();

    try {
        console.log('🌱 Iniciando seeders...');

        // Verificar si ya existen datos
        const adminCount = await Administrador.count({ transaction });

        if (adminCount > 0) {
            console.log('⚠️  Ya existen datos. Saltando seeders.');
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
        console.log(`✅ Admin: ${admin.email} / Admin123!`);

        // 2. Crear universidad
        console.log('🏛️  Creando universidad...');
        const universidad = await Universidad.create({
            nombre: 'Universidad Técnica del Norte',
            activa: true
        }, { transaction });
        console.log(`✅ Universidad: ${universidad.nombre}`);

        // 3. Crear periodo
        console.log('📅 Creando periodo...');
        const periodo = await Periodo.create({
            universidad_id: universidad.id,
            nombre: '2025-I',
            fecha_inicio: '2025-01-15',
            fecha_fin: '2025-07-15',
            horas_totales_requeridas: 240,
            activo: true
        }, { transaction });
        console.log(`✅ Periodo: ${periodo.nombre} (${periodo.horas_totales_requeridas}h)`);

        // 4. Crear estudiantes
        console.log('👨‍🎓 Creando estudiantes...');
        const estudiantesData = [
            { nombres: 'Juan', apellidos: 'Pérez', email: 'juan.perez@ejemplo.com' },
            { nombres: 'María', apellidos: 'García', email: 'maria.garcia@ejemplo.com' },
            { nombres: 'Carlos', apellidos: 'López', email: 'carlos.lopez@ejemplo.com' }
        ];

        const estudiantesCreados = [];
        for (const est of estudiantesData) {
            const passwordHash = await bcrypt.hash('Estudiante123!', 12);
            const estudiante = await Estudiante.create({
                nombres: est.nombres,
                apellidos: est.apellidos,
                email: est.email,
                password_hash: passwordHash,
                universidad_id: universidad.id,
                periodo_id: periodo.id,
                activo: true
            }, { transaction });
            estudiantesCreados.push(estudiante);
            console.log(`   ✓ ${est.nombres} ${est.apellidos} (${est.email})`);
        }

        // 5. Crear registros de horas
        console.log('⏱️  Creando registros...');
        const registros = [
            { fecha: '2025-01-16', horas: 8, descripcion: 'Orientación inicial' },
            { fecha: '2025-01-17', horas: 7.5, descripcion: 'Capacitación' },
            { fecha: '2025-01-18', horas: 6, descripcion: 'Desarrollo' }
        ];

        for (const reg of registros) {
            await RegistroHora.create({
                estudiante_id: estudiantesCreados[0].id,
                fecha: reg.fecha,
                horas: reg.horas,
                descripcion: reg.descripcion
            }, { transaction });
        }
        console.log(`   ✓ ${registros.length} registros creados`);

        await transaction.commit();

        console.log('\n✨ ¡Seeders completados!\n');
        console.log('📋 CREDENCIALES:');
        console.log('──────────────────────────────────');
        console.log('👤 Admin: admin@controlpracticas.com / Admin123!');
        console.log('👨‍🎓 Estudiantes: Estudiante123!');
        console.log('──────────────────────────────────\n');

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en seeders:', error);
        throw error;
    }
}

if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = seedDatabase;