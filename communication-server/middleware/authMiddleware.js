
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../database/db");

function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = hashToken(token);

    const session = db.prepare(`
      SELECT
        sessions.id,
        sessions.drone_id,
        sessions.expires_at,
        sessions.revoked_at,
        drones.serial_number,
        drones.drone_name,
        drones.is_active
      FROM sessions
      JOIN drones ON drones.id = sessions.drone_id
      WHERE sessions.id = ?
        AND sessions.token_hash = ?
    `).get(decoded.jti, tokenHash);

    if (
      !session ||
      session.revoked_at ||
      session.is_active !== 1 ||
      session.drone_id !== Number(decoded.sub) ||
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      return res.status(401).json({
        success: false,
        message: "Session expired or revoked. Please log in again."
      });
    }

    req.auth = {
      sessionId: session.id,
      droneId: session.drone_id,
      serialNumber: session.serial_number,
      droneName: session.drone_name
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token."
    });
  }
}

module.exports = authenticateToken;
