// ==================== models/index.js ====================
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Configurar Sequelize
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: process.env.DB_SSL === 'true' ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// ========== DEFINICIÓN DE MODELOS ==========

// Universidad
const Universidad = sequelize.define('Universidad', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'universidades',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Periodo
const Periodo = sequelize.define('Periodo', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    universidad_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fecha_fin: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    horas_totales_requeridas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'periodos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Estudiante
const Estudiante = sequelize.define('Estudiante', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    universidad_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    periodo_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'estudiantes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Administrador
const Administrador = sequelize.define('Administrador', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    super_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'administradores',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// RegistroHora
const RegistroHora = sequelize.define('RegistroHora', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    estudiante_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    horas: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'registros_horas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// ========== RELACIONES ==========

// Universidad -> Periodos
Universidad.hasMany(Periodo, {
    foreignKey: 'universidad_id',
    as: 'periodos'
});
Periodo.belongsTo(Universidad, {
    foreignKey: 'universidad_id',
    as: 'universidad'
});

// Universidad -> Estudiantes
Universidad.hasMany(Estudiante, {
    foreignKey: 'universidad_id',
    as: 'estudiantes'
});
Estudiante.belongsTo(Universidad, {
    foreignKey: 'universidad_id',
    as: 'universidad'
});

// Periodo -> Estudiantes
Periodo.hasMany(Estudiante, {
    foreignKey: 'periodo_id',
    as: 'estudiantes'
});
Estudiante.belongsTo(Periodo, {
    foreignKey: 'periodo_id',
    as: 'periodo'
});

// Estudiante -> RegistrosHoras
Estudiante.hasMany(RegistroHora, {
    foreignKey: 'estudiante_id',
    as: 'registros'
});
RegistroHora.belongsTo(Estudiante, {
    foreignKey: 'estudiante_id',
    as: 'estudiante'
});

// ========== SINCORNIZACIÓN SEGURA ==========

const syncDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a PostgreSQL establecida');

        // IMPORTANTE: No usar alter:true, solo crear tablas si no existen
        // Esto evita modificar tablas existentes y las vistas que dependen de ellas
        await sequelize.sync({ 
            force: false,      // NO borra tablas existentes
            alter: false       // NO modifica tablas existentes
        });
        
        console.log('✅ Modelos verificados (sin alterar tablas existentes)');
        return true;
        
    } catch (error) {
        console.error('❌ Error al verificar modelos:', error.message);
        
        // Si es un error de vista, continuamos igual (es normal)
        if (error.message.includes('view') || error.message.includes('vista')) {
            console.log('⚠️  Advertencia: Hay vistas que dependen de las tablas');
            console.log('📌 Continuando sin modificaciones...');
            return true;
        }
        
        // Para otros errores, mostramos más detalles
        console.error('📋 Detalles del error:', {
            name: error.name,
            code: error.parent?.code,
            detail: error.parent?.detail
        });
        
        return false;
    }
};

// ========== VERIFICACIÓN DE TABLAS ==========

const checkTables = async () => {
    try {
        const tables = ['universidades', 'periodos', 'estudiantes', 'administradores', 'registros_horas'];
        const results = [];
        
        for (const table of tables) {
            try {
                const [result] = await sequelize.query(
                    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`
                );
                const exists = result[0].exists;
                results.push({ table, exists });
                console.log(`${exists ? '✅' : '❌'} Tabla "${table}": ${exists ? 'EXISTE' : 'NO EXISTE'}`);
            } catch (err) {
                console.error(`⚠️  Error verificando tabla "${table}":`, err.message);
                results.push({ table, exists: false, error: err.message });
            }
        }
        
        return results;
    } catch (error) {
        console.error('❌ Error verificando tablas:', error.message);
        return [];
    }
};

// ========== INICIALIZACIÓN SEGURA ==========

const initializeDatabase = async () => {
    console.log('🔧 Inicializando base de datos...');
    
    // 1. Verificar conexión
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a PostgreSQL establecida');
    } catch (error) {
        console.error('❌ No se pudo conectar a PostgreSQL:', error.message);
        throw new Error('No se pudo conectar a la base de datos');
    }
    
    // 2. Verificar tablas existentes
    console.log('📊 Verificando tablas existentes...');
    const tableStatus = await checkTables();
    
    // 3. Intentar sincronizar (solo creará tablas que no existen)
    console.log('⚙️  Sincronizando modelos (solo creación)...');
    const syncResult = await syncDatabase();
    
    if (!syncResult) {
        console.warn('⚠️  La sincronización tuvo problemas, pero continuamos...');
    }
    
    // 4. Verificar estado final
    console.log('📋 Estado final de tablas:');
    const finalStatus = await checkTables();
    
    const missingTables = finalStatus.filter(t => !t.exists);
    if (missingTables.length > 0) {
        console.warn('⚠️  Las siguientes tablas no existen:', missingTables.map(t => t.table).join(', '));
        console.log('💡 Ejecuta el script de seeds o crea las tablas manualmente');
    } else {
        console.log('🎉 Todas las tablas están listas');
    }
    
    return {
        connection: true,
        syncResult,
        tables: finalStatus
    };
};

// ========== EXPORTACIONES ==========

module.exports = {
    sequelize,
    Universidad,
    Periodo,
    Estudiante,
    Administrador,
    RegistroHora,
    syncDatabase,
    checkTables,
    initializeDatabase
};