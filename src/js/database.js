const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../padel.db');
const db = new sqlite3.Database(dbPath);

// Crear tablas si no existen
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS canchas (
        id INTEGER PRIMARY KEY,
        nombre TEXT,
        precio_hora REAL,
        techo TEXT CHECK(techo IN ('abierta', 'cerrada')),
        imagen TEXT
    )
`);

    db.run(`
    CREATE TABLE IF NOT EXISTS reservas (
        id INTEGER PRIMARY KEY,
        cancha_id INTEGER,
        fecha TEXT,
        hora_inicio TEXT,
        hora_fin TEXT,
        cliente_nombre TEXT,
        cliente_telefono TEXT,
        FOREIGN KEY (cancha_id) REFERENCES canchas(id)
    )
    `);
});

module.exports = db;