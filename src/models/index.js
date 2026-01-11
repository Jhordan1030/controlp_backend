// src/models/index.js
const { DataTypes } = require('sequelize');

// Importar sequelize desde database/index.js
const sequelize = require('../database/index');

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
    // Verificar si sequelize es válido
    if (!sequelize || !sequelize.authenticate) {
      console.warn('⚠️  Sequelize no está disponible - omitiendo sincronización');
      return false;
    }

    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');

    // Solo crear tablas si no existen
    await sequelize.sync({ 
      force: false,
      alter: false
    });
    
    console.log('✅ Modelos verificados');
    return true;
    
  } catch (error) {
    console.error('❌ Error al verificar modelos:', error.message);
    return false;
  }
};

// ========== VERIFICACIÓN DE TABLAS ==========

const checkTables = async () => {
  try {
    // Verificar si sequelize es válido
    if (!sequelize || !sequelize.query) {
      console.warn('⚠️  Sequelize no disponible - omitiendo verificación de tablas');
      return [];
    }

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
    if (!sequelize || !sequelize.authenticate) {
      throw new Error('Sequelize no está disponible');
    }
    
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
  } catch (error) {
    console.error('❌ No se pudo conectar a PostgreSQL:', error.message);
    return {
      connection: false,
      syncResult: false,
      tables: [],
      error: error.message
    };
  }
  
  // 2. Intentar sincronizar
  console.log('⚙️  Sincronizando modelos...');
  const syncResult = await syncDatabase();
  
  // 3. Verificar tablas
  console.log('📋 Verificando tablas...');
  const tables = await checkTables();
  
  return {
    connection: true,
    syncResult,
    tables
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