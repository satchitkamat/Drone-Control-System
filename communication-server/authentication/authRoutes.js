
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../database/db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { serialNumber, password } = req.body || {};

    if (
      typeof serialNumber !== "string" ||
      typeof password !== "string" ||
      !serialNumber.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Serial number and password are required."
      });
    }

    if (serialNumber.length > 40 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Invalid login credentials."
      });
    }

    const normalizedSerial = serialNumber.trim().toUpperCase();

    const drone = db.prepare(`
      SELECT id, serial_number, password_hash, drone_name, is_active
      FROM drones
      WHERE serial_number = ?
    `).get(normalizedSerial);

    if (!drone || drone.is_active !== 1) {
      return res.status(401).json({
        success: false,
        message: "Invalid serial number or password."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      drone.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid serial number or password."
      });
    }

    const sessionId = crypto.randomUUID();
    const duration = process.env.SESSION_DURATION || "8h";

    const token = jwt.sign(
      {
        sub: String(drone.id),
        serialNumber: drone.serial_number
      },
      process.env.JWT_SECRET,
      {
        jwtid: sessionId,
        expiresIn: duration
      }
    );

    const decoded = jwt.decode(token);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (
        id,
        drone_id,
        token_hash,
        expires_at
      )
      VALUES (?, ?, ?, ?)
    `).run(
      sessionId,
      drone.id,
      tokenHash,
      expiresAt
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      drone: {
        serialNumber: drone.serial_number,
        droneName: drone.drone_name
      },
      expiresAt
    });

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to complete login."
    });
  }
});

// GET CURRENT AUTHENTICATED DRONE
router.get("/me", authenticateToken, (req, res) => {
  return res.status(200).json({
    success: true,
    drone: {
      serialNumber: req.auth.serialNumber,
      droneName: req.auth.droneName
    }
  });
});

// LOGOUT
router.post("/logout", authenticateToken, (req, res) => {
  try {
    db.prepare(`
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND revoked_at IS NULL
    `).run(req.auth.sessionId);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });

  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log out."
    });
  }
});

module.exports = router;
