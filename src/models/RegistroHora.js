const { DataTypes } = require('sequelize');
const sequelize = require('../database');

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
    },
    tipo_actividad_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    proyecto: {
        type: DataTypes.STRING,
        allowNull: true
    },
    supervisor: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ubicacion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    estado_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    matriculacion_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    aprobado_por: {
        type: DataTypes.UUID,
        allowNull: true
    },
    horas_aprobadas: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true
    },
    comentarios_aprobador: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_aprobacion: {
        type: DataTypes.DATE, // timestamp in schema
        allowNull: true
    }
}, {
    tableName: 'registros_horas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            name: 'idx_registros_estudiante',
            fields: ['estudiante_id']
        },
        {
            name: 'idx_registros_fecha',
            fields: ['fecha']
        },
        {
            name: 'idx_registros_estudiante_fecha',
            fields: ['estudiante_id', 'fecha']
        }
    ]
});

module.exports = RegistroHora;