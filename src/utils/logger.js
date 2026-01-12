// src/utils/logger.js
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Colores de texto
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',

    // Colores de fondo
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};

class Logger {
    constructor() {
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        // Default env is 'development' unless specified
        // Force DEBUG level if we are not strictly in production or if LOG_LEVEL is set
        const isProduction = process.env.NODE_ENV === 'production';
        this.currentLevel = isProduction ? this.levels.INFO : this.levels.DEBUG;

        // Force DEBUG if we are local even if someone set NODE_ENV=production by mistake
        if (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
            this.currentLevel = this.levels.DEBUG;
        }
    }

    getTimestamp() {
        return new Date().toISOString().replace('T', ' ').substring(0, 19);
    }

    log(level, message, data = null) {
        if (this.levels[level] > this.currentLevel) return;

        const timestamp = this.getTimestamp();
        let color = colors.white;
        let emoji = '📝';

        switch (level) {
            case 'ERROR':
                color = colors.red;
                emoji = '❌';
                break;
            case 'WARN':
                color = colors.yellow;
                emoji = '⚠️';
                break;
            case 'INFO':
                color = colors.cyan;
                emoji = 'ℹ️';
                break;
            case 'DEBUG':
                color = colors.dim;
                emoji = '🐛';
                break;
        }

        // Imprimir mensaje principal
        console.log(`${color}${emoji} [${timestamp}] [${level.padEnd(5)}] ${message}${colors.reset}`);

        // Imprimir datos adicionales si existen
        if (data && this.currentLevel >= this.levels.DEBUG) {
            console.log(`${colors.dim}📊 Datos: ${JSON.stringify(data, null, 2)}${colors.reset}`);
        }

        // En producción, también guardar en archivo (opcional)
        if (process.env.NODE_ENV === 'production' && level === 'ERROR') {
            this.logToFile(level, message, data);
        }
    }

    logToFile(level, message, data) {
        // Implementación básica para guardar en archivo
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(__dirname, '../../logs');

        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            stack: data?.stack
        };

        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }

    error(message, data = null) {
        this.log('ERROR', message, data);
    }

    warn(message, data = null) {
        this.log('WARN', message, data);
    }

    info(message, data = null) {
        this.log('INFO', message, data);
    }

    debug(message, data = null) {
        this.log('DEBUG', message, data);
    }

    // Métodos específicos para la API
    dbQuery(sql, duration) {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.log(`${colors.magenta}🗄️  [DB] ${sql.substring(0, 100)}... (${duration}ms)${colors.reset}`);
        }
    }

    auditLog(action, table, userId) {
        this.info(`📝 Auditoría: ${action} en ${table}`, { userId });
    }

    requestLog(method, path, status, duration) {
        const statusColor = status >= 400 ? colors.red : status >= 300 ? colors.yellow : colors.green;
        console.log(`${statusColor}🌐 [${method}] ${path} → ${status} (${duration}ms)${colors.reset}`);
    }
}

// Exportar instancia única
module.exports = new Logger();