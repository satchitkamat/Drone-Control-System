
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const db = require("./database/db");
const authRoutes = require("./authentication/authRoutes");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with a strong secret.");
}

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(express.json({ limit: "10kb" }));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later."
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Drone Control Authentication Server is running."
  });
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log("----------------------------------");
  console.log("Drone Control Authentication Server");
  console.log(`Running on http://127.0.0.1:${PORT}`);
  console.log("----------------------------------");
});

function shutdown() {
  console.log("Shutting down server...");

  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
