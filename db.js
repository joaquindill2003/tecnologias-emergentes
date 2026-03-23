import Database from 'better-sqlite3';

const db = new Database('database.db');

// crear tabla
db.prepare(`
CREATE TABLE IF NOT EXISTS historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oLat TEXT,
  oLon TEXT,
  dLat TEXT,
  dLon TEXT,
  distancia TEXT,
  duracion TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

export { db };