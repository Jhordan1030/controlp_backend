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
        type: DataTypes.STRING(20),
        allowNull: true
    },
    accion: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    tabla_afectada: {
        type: DataTypes.STRING(50),
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
        type: DataTypes.INET,
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
    updatedAt: false // No tiene updated_at
});

module.exports = Auditoria;
