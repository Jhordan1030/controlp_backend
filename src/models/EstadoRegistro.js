const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const EstadoRegistro = sequelize.define('EstadoRegistro', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'estados_registro',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Schema doesn't mention updated_at for this table? Wait, let me check request.
    // Schema: "created_at timestamp with time zone NOT NULL"
    // No updated_at in schema for estados_registro
});

module.exports = EstadoRegistro;
