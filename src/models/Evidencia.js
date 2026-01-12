const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Evidencia = sequelize.define('Evidencia', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    registro_horas_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    nombre_archivo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tipo_archivo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tamanio_bytes: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'evidencias',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Evidencia;
