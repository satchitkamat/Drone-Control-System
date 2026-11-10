
document.addEventListener("DOMContentLoaded", async () => {

  // ELEMENTS
  const clock = document.getElementById("clock");
  const logoutButton = document.getElementById("logoutButton");

  const droneNameElement = document.getElementById("droneName");
  const droneSerialElement = document.getElementById("droneSerial");

  const sidebarDroneName = document.getElementById("sidebarDroneName");
  const sidebarDroneSerial = document.getElementById("sidebarDroneSerial");

  const activityDroneIdentity = document.getElementById(
    "activityDroneIdentity"
  );

  // CLOCK
  function updateClock() {
    if (!clock) return;

    const now = new Date();

    clock.textContent = now.toLocaleTimeString("en-IN", {
      hour12: false
    });
  }

  updateClock();
  setInterval(updateClock, 1000);

  // CHECK ELECTRON API
  if (!window.droneApp) {
    console.error("Drone application API is unavailable.");

    if (droneNameElement) {
      droneNameElement.textContent = "Application error";
    }

    return;
  }

  console.log("Drone Control System dashboard loaded.");
  console.log(window.droneApp.getAppName());

  // LOAD AUTHENTICATED DRONE
  async function loadAuthenticatedDrone() {
    try {
      const drone = await window.droneApp.getAuthenticatedDrone();

      if (!drone) {
        console.error("No authenticated drone session found.");

        droneNameElement.textContent = "Session unavailable";
        droneSerialElement.textContent = "Serial: --";

        sidebarDroneName.textContent = "Not authenticated";
        sidebarDroneSerial.textContent = "Session unavailable";

        if (activityDroneIdentity) {
          activityDroneIdentity.textContent =
            "Unable to verify drone identity";
        }

        return;
      }

      const name = drone.droneName || "Unnamed Drone";
      const serial = drone.serialNumber || "Unknown";

      // DASHBOARD IDENTITY
      droneNameElement.textContent = name;
      droneSerialElement.textContent = `Serial: ${serial}`;

      // SIDEBAR IDENTITY
      sidebarDroneName.textContent = name;
      sidebarDroneSerial.textContent = serial;

      // ACTIVITY
      if (activityDroneIdentity) {
        activityDroneIdentity.textContent =
          `${name} (${serial}) authenticated successfully`;
      }

      console.log("Authenticated drone:", drone);

    } catch (error) {
      console.error("Unable to load authenticated drone:", error);

      droneNameElement.textContent = "Loading failed";
      sidebarDroneName.textContent = "Loading failed";
    }
  }

  await loadAuthenticatedDrone();

  // LOGOUT
  logoutButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out of this drone?"
    );

    if (!confirmed) return;

    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    try {
      const result = await window.droneApp.logout();

      if (!result || !result.success) {
        console.error("Logout failed:", result);

        logoutButton.disabled = false;
        logoutButton.textContent = "⇥ Logout";

        window.alert("Unable to complete logout. Please try again.");
      }

    } catch (error) {
      console.error("Logout error:", error);

      logoutButton.disabled = false;
      logoutButton.textContent = "⇥ Logout";

      window.alert("An error occurred during logout.");
    }
  });

});
