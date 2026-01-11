// src/models/index.js
const { DataTypes } = require('sequelize');

// ========== IMPORTACIÓN SEGURA DE SEQUELIZE ==========
console.log('🔄 Cargando modelos...');

let sequelize;
try {
  sequelize = require('../database/index');
  console.log('✅ Sequelize cargado desde database/index.js');
} catch (error) {
  console.error('❌ Error al cargar Sequelize:', error.message);
  
  // Crear instancia dummy
  sequelize = {
    define: (name, attributes, options) => {
      console.warn(`⚠️  Creando modelo dummy: ${name}`);
      const model = {
        name,
        init: () => {},
        findAll: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        create: (data) => Promise.resolve({ id: Date.now(), ...data }),
        update: (values, options) => Promise.resolve([0]),
        destroy: (options) => Promise.resolve(0),
        belongsTo: () => {},
        hasMany: () => {},
        belongsToMany: () => {}
      };
      return model;
    },
    authenticate: () => Promise.reject(new Error('Base de datos no disponible')),
    sync: () => {
      console.log('🔄 Sync dummy ejecutada');
      return Promise.resolve();
    },
    query: (sql, options) => {
      console.log(`📝 Query dummy: ${sql.substring(0, 50)}...`);
      return Promise.resolve([[], {}]);
    }
  };
  
  console.log('⚠️  Usando Sequelize dummy (modo sin base de datos)');
}

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

try {
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
  
  console.log('✅ Relaciones establecidas');
} catch (error) {
  console.warn('⚠️  No se pudieron establecer relaciones:', error.message);
}

// ========== FUNCIONES DE BASE DE DATOS ==========

const syncDatabase = async () => {
  try {
    console.log('🔄 Intentando sincronizar base de datos...');
    
    if (!sequelize || typeof sequelize.sync !== 'function') {
      console.warn('⚠️  Sequelize no está disponible para sincronizar');
      return false;
    }
    
    await sequelize.sync({ 
      force: false,
      alter: false
    });
    
    console.log('✅ Base de datos sincronizada');
    return true;
    
  } catch (error) {
    console.error('❌ Error al sincronizar base de datos:', error.message);
    return false;
  }
};

const checkTables = async () => {
  try {
    console.log('📊 Verificando tablas...');
    
    if (!sequelize || typeof sequelize.query !== 'function') {
      console.warn('⚠️  No se puede verificar tablas - Sequelize no disponible');
      return [];
    }
    
    const tables = ['universidades', 'periodos', 'estudiantes', 'administradores', 'registros_horas'];
    const results = [];
    
    for (const table of tables) {
      try {
        const [result] = await sequelize.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${table}')`
        );
        const exists = result[0]?.exists || false;
        results.push({ table, exists });
        console.log(`${exists ? '✅' : '❌'} Tabla "${table}": ${exists ? 'EXISTE' : 'NO EXISTE'}`);
      } catch (err) {
        console.warn(`⚠️  Error verificando tabla "${table}":`, err.message);
        results.push({ table, exists: false, error: err.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error general verificando tablas:', error.message);
    return [];
  }
};

const initializeDatabase = async () => {
  console.log('🔧 Inicializando base de datos...');
  
  try {
    // 1. Verificar conexión
    if (sequelize && typeof sequelize.authenticate === 'function') {
      await sequelize.authenticate();
      console.log('✅ Conexión establecida');
    } else {
      console.warn('⚠️  No se puede autenticar - usando modo dummy');
    }
    
    // 2. Sincronizar
    const syncResult = await syncDatabase();
    
    // 3. Verificar tablas
    const tables = await checkTables();
    
    return {
      connection: true,
      syncResult,
      tables
    };
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    return {
      connection: false,
      syncResult: false,
      tables: [],
      error: error.message
    };
  }
};

// ========== EXPORTACIONES ==========

console.log('📦 Exportando modelos...');

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