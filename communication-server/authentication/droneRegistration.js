
const bcrypt = require("bcryptjs");
const db = require("../database/db");

const registerDrone = db.prepare(`
  INSERT INTO drones (
    serial_number,
    password_hash,
    drone_name
  )
  VALUES (?, ?, ?)
`);

const findDrone = db.prepare(`
  SELECT id, serial_number, drone_name, is_active, created_at
  FROM drones
  WHERE serial_number = ?
`);

async function createDrone(serialNumber, password, droneName) {
  if (!serialNumber || !password || !droneName) {
    throw new Error("All drone registration fields are required.");
  }

  const normalizedSerial = serialNumber.trim().toUpperCase();

  if (!/^[A-Z0-9-]{4,40}$/.test(normalizedSerial)) {
    throw new Error("Invalid drone serial number.");
  }

  if (password.length < 12) {
    throw new Error("Drone password must be at least 12 characters.");
  }

  if (password.length > 128) {
    throw new Error("Drone password is too long.");
  }

  if (droneName.trim().length > 80) {
    throw new Error("Drone name is too long.");
  }

  const existingDrone = findDrone.get(normalizedSerial);

  if (existingDrone) {
    throw new Error("A drone with this serial number already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const result = registerDrone.run(
      normalizedSerial,
      passwordHash,
      droneName.trim()
    );

    return {
      id: result.lastInsertRowid,
      serialNumber: normalizedSerial,
      droneName: droneName.trim()
    };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new Error("A drone with this serial number already exists.");
    }

    throw error;
  }
}

module.exports = {
  createDrone
};
