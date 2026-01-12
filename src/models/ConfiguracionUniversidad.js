const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const ConfiguracionUniversidad = sequelize.define('ConfiguracionUniversidad', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    universidad_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true
    },
    max_horas_diarias: {
        type: DataTypes.NUMERIC,
        defaultValue: 8
    },
    min_descripcion_length: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    requiere_evidencia: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    limite_horas_diarias: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'configuracion_universidad',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = ConfiguracionUniversidad;
