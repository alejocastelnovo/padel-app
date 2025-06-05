const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const Logger = require('./utils/logger');

let mainWindow;
let db;
let logger;

// Inicializar la base de datos
async function initDatabase() {
    const dbPath = path.join(app.getPath('userData'), 'padel.db');
    logger.info(`Iniciando base de datos en: ${dbPath}`);

    // Asegurarse de que el directorio existe
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        logger.info(`Creando directorio para la base de datos: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
    }

    // Verificar si el archivo de la base de datos existe
    const dbExists = fs.existsSync(dbPath);
    logger.info(`¿La base de datos existe? ${dbExists}`);

    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            logger.error('Error al conectar con la base de datos', err);
        } else {
            logger.info('Conexión exitosa con la base de datos');
            createTables();
        }
    });
}

// Crear tablas
function createTables() {
    logger.info('Iniciando creación de tablas...');
    
    db.serialize(() => {
        // Tabla de canchas
        db.run(`CREATE TABLE IF NOT EXISTS canchas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            precio_hora REAL NOT NULL,
            tipo TEXT NOT NULL,
            activa INTEGER DEFAULT 1,
            descripcion TEXT,
            superficie TEXT,
            techada BOOLEAN DEFAULT 0,
            iluminacion BOOLEAN DEFAULT 1,
            dimensiones TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                logger.error('Error al crear tabla canchas:', err);
            } else {
                logger.info('Tabla canchas creada o ya existente');
                // Verificar si hay datos en la tabla
                db.get('SELECT COUNT(*) as count FROM canchas', (err, row) => {
                    if (err) {
                        logger.error('Error al contar canchas:', err);
                    } else {
                        logger.info(`Número de canchas en la base de datos: ${row.count}`);
                    }
                });
            }
        });

        // Tabla de reservas
        db.run(`CREATE TABLE IF NOT EXISTS reservas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cancha_id INTEGER NOT NULL,
            fecha DATE NOT NULL,
            hora_inicio TIME NOT NULL,
            hora_fin TIME NOT NULL,
            cliente_nombre TEXT NOT NULL,
            cliente_telefono TEXT NOT NULL,
            estado TEXT DEFAULT 'activa',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cancha_id) REFERENCES canchas(id)
        )`, (err) => {
            if (err) {
                logger.error('Error al crear tabla reservas:', err);
            } else {
                logger.info('Tabla reservas creada o ya existente');
            }
        });

        // Tabla de configuración
        db.run(`CREATE TABLE IF NOT EXISTS configuracion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clave TEXT UNIQUE NOT NULL,
            valor TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                logger.error('Error al crear tabla configuracion:', err);
            } else {
                logger.info('Tabla configuracion creada o ya existente');
            }
        });

        // Agregar columna notas a reservas si no existe
        db.run(`ALTER TABLE reservas ADD COLUMN notas TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                logger.error('Error al agregar columna notas:', err);
            } else if (!err) {
                logger.info('Columna notas agregada a reservas');
            }
        });

        // Agregar columna metodo_pago a reservas si no existe
        db.run(`ALTER TABLE reservas ADD COLUMN metodo_pago TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column')) {
                logger.error('Error al agregar columna metodo_pago:', err);
            }
        });
    });
}

function createWindow() {
    try {
        require('electron-reloader')(module);
    } catch {} // Solo en desarrollo

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'src/js/preload.js')
        }
    });

    // Establecer política de seguridad básica
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:;",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:;",
                    "style-src 'self' 'unsafe-inline' https: http:;",
                    "img-src 'self' data: https: http: blob:;",
                    "font-src 'self' data: https: http:;",
                    "connect-src 'self' https: http:;"
                ]
            }
        });
    });

    mainWindow.loadFile('src/index.html');

    //Esto habilita el menu del f12 para ver la consola de javascript y demas cosas
    mainWindow.webContents.openDevTools(); 
}

// Manejadores de IPC
ipcMain.handle('get-db-path', () => {
    return path.join(app.getPath('userData'), 'padel.db');
});

ipcMain.handle('db-query', async (event, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle('db-query-one', async (event, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
});

ipcMain.handle('db-run', async (event, sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
});

app.whenReady().then(() => {
    logger = new Logger(app);
    initDatabase();
    createWindow();
});