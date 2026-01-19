const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const SolicitudDemo = sequelize.define('SolicitudDemo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_completo: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    codigo_pais: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    fecha_solicitud: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    estado: {
        type: DataTypes.STRING(20),
        defaultValue: 'pendiente' // pendiente, contactado, descartado
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'solicitudes_demo', // Explicitly match existing table name
    timestamps: false // The table uses 'fecha_solicitud' instead of createdAt/updatedAt
});

module.exports = SolicitudDemo;
