
document.addEventListener("DOMContentLoaded", () => {
  const versionElement = document.getElementById("app-version");

  versionElement.textContent =
    `${window.droneApp.getAppName()} | Version ${window.droneApp.getAppVersion()}`;
});
