
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("droneApp", {
  getAppName: () => "Drone Control System",
  getAppVersion: () => "1.0.0"
});
