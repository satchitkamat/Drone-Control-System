
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const API_URL = "http://127.0.0.1:5000/api";

let mainWindow = null;
let authToken = null;
let authenticatedDrone = null;

// FILE PATHS
const LOGIN_PATH = path.join(__dirname, "renderer", "login.html");
const DASHBOARD_PATH = path.join(__dirname, "renderer", "index.html");

// CREATE WINDOW
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "Drone Control System",

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // PAGE LOAD DIAGNOSTICS
  mainWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("Page loading failed:", {
        errorCode,
        errorDescription,
        validatedURL
      });
    }
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log(
      "Page loaded:",
      mainWindow.webContents.getURL()
    );
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    authToken = null;
    authenticatedDrone = null;
  });

  // OPEN LOGIN PAGE
  loadPage(LOGIN_PATH);
}

// LOAD PAGE SAFELY
async function loadPage(filePath) {
  if (!mainWindow) {
    throw new Error("Application window is unavailable.");
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Page not found: ${filePath}`);
  }

  await mainWindow.loadFile(filePath);
}

// LOGIN
ipcMain.handle("auth:login", async (_event, credentials) => {
  if (
    !credentials ||
    typeof credentials.serialNumber !== "string" ||
    typeof credentials.password !== "string"
  ) {
    return {
      success: false,
      message: "Please enter valid login details."
    };
  }

  try {
    console.log("Authenticating drone...");

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serialNumber: credentials.serialNumber.trim().toUpperCase(),
        password: credentials.password
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.log("Authentication rejected.");

      return {
        success: false,
        message: data.message || "Invalid login credentials."
      };
    }

    authToken = data.token;
    authenticatedDrone = data.drone;

    console.log(
      "Authentication successful for:",
      authenticatedDrone.serialNumber
    );

    return {
      success: true,
      drone: authenticatedDrone
    };

  } catch (error) {
    console.error("Authentication error:", error);

    return {
      success: false,
      message: "Cannot reach the authentication server."
    };
  }
});

// OPEN DASHBOARD
ipcMain.handle("auth:open-dashboard", async () => {
  if (!authToken || !authenticatedDrone || !mainWindow) {
    console.error("Dashboard access denied: no active login.");

    return false;
  }

  try {
    console.log("Opening drone dashboard...");

    await loadPage(DASHBOARD_PATH);

    console.log("Dashboard navigation completed.");

    return true;

  } catch (error) {
    console.error("Dashboard navigation error:", error);

    return false;
  }
});

// GET AUTHENTICATED DRONE
ipcMain.handle("auth:get-drone", async () => {
  if (!authToken || !authenticatedDrone) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      console.log("Session expired or invalid.");

      authToken = null;
      authenticatedDrone = null;

      if (mainWindow) {
        await loadPage(LOGIN_PATH);
      }

      return null;
    }

    const data = await response.json();

    return data.drone || null;

  } catch (error) {
    console.error("Session verification error:", error);

    return null;
  }
});

// LOGOUT
ipcMain.handle("auth:logout", async () => {
  try {
    if (authToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
    }
  } catch (error) {
    console.error("Logout request error:", error);
  }

  // CLEAR LOCAL SESSION
  authToken = null;
  authenticatedDrone = null;

  try {
    if (mainWindow) {
      await loadPage(LOGIN_PATH);
    }

    return {
      success: true
    };

  } catch (error) {
    console.error("Logout navigation error:", error);

    return {
      success: false,
      message: "Logged out, but unable to open login page."
    };
  }
});

// APPLICATION START
app.whenReady().then(() => {
  console.log("----------------------------------");
  console.log("DRONE CONTROL SYSTEM");
  console.log("----------------------------------");

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// APPLICATION CLOSE
app.on("window-all-closed", () => {
  authToken = null;
  authenticatedDrone = null;

  if (process.platform !== "darwin") {
    app.quit();
  }
});

// CLEANUP
app.on("before-quit", () => {
  authToken = null;
  authenticatedDrone = null;
});
