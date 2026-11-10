
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const databasePath = path.join(__dirname, "drone-control.db");

if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

const db = new Database(databasePath);

// Database safety and performance settings
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

// Create database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS drones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    drone_name TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    drone_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TEXT,
    FOREIGN KEY (drone_id) REFERENCES drones(id)
  );

  CREATE INDEX IF NOT EXISTS idx_drones_serial
  ON drones(serial_number);

  CREATE INDEX IF NOT EXISTS idx_sessions_drone
  ON sessions(drone_id);

  CREATE INDEX IF NOT EXISTS idx_sessions_expiry
  ON sessions(expires_at);
`);

console.log("Database initialized successfully.");

module.exports = db;
