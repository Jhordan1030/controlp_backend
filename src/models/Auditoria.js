const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Auditoria = sequelize.define('Auditoria', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    usuario_tipo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    accion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tabla_afectada: {
        type: DataTypes.STRING,
        allowNull: true
    },
    registro_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    detalles: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    ip_address: {
        // Using STRING to correspond to 'inet' safely
        type: DataTypes.STRING,
        allowNull: true
    },
    user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'auditoria',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Auditoria;
