const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Sesion = sequelize.define('Sesion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    usuario_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    usuario_tipo: {
        type: DataTypes.STRING, // Handling USER-DEFINED as STRING for now
        allowNull: false
    },
    token_hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expira_en: {
        type: DataTypes.DATE, // timestamp with time zone
        allowNull: false
    },
    activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'sesiones',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Schema doesn't mention updated_at for sesiones
});

module.exports = Sesion;
