
const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script loaded successfully.");

contextBridge.exposeInMainWorld("droneApp", {
  getAppName: () => "Drone Control System",
  getAppVersion: () => "1.0.0",

  login: (credentials) =>
    ipcRenderer.invoke("auth:login", credentials),

  openDashboard: () =>
    ipcRenderer.invoke("auth:open-dashboard"),

  getAuthenticatedDrone: () =>
    ipcRenderer.invoke("auth:get-drone"),

  logout: () =>
    ipcRenderer.invoke("auth:logout")
});
