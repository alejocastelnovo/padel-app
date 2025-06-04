const fs = require('fs');
const path = require('path');

class Logger {
    constructor(app) {
        // Creamos un directorio para los logs
        this.logsDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }

        this.logFile = path.join(this.logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
    }

    _writeLog(level, message, error = null) {
        const timestamp = new Date().toISOString();
        let logMessage = `[${timestamp}] [${level}] ${message}`;
        
        if (error) {
            logMessage += `\nError: ${error.message}\nStack: ${error.stack}\n`;
        }

        // Escribimos en el archivo
        fs.appendFileSync(this.logFile, logMessage + '\n');
        
        // También mostramos en consola
        console[level.toLowerCase()](logMessage);
    }

    info(message) {
        this._writeLog('INFO', message);
    }

    error(message, error = null) {
        this._writeLog('ERROR', message, error);
    }

    warn(message) {
        this._writeLog('WARN', message);
    }
}

module.exports = Logger;