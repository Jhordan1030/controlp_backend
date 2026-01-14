const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Matriculacion = sequelize.define('Matriculacion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    estudiante_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    periodo_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    fecha_matricula: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    horas_acumuladas: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    horas_aprobadas: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    porcentaje_completado: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    }
}, {
    tableName: 'matriculaciones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'matriculaciones_estudiante_id_periodo_id',
            unique: true,
            fields: ['estudiante_id', 'periodo_id']
        }
    ]
});

module.exports = Matriculacion;
