
document.addEventListener("DOMContentLoaded", () => {
  const clock = document.getElementById("clock");

  function updateClock() {
    const now = new Date();

    clock.textContent = now.toLocaleTimeString("en-IN", {
      hour12: false
    });
  }

  updateClock();
  setInterval(updateClock, 1000);

  console.log("Drone Control System dashboard loaded.");
  console.log(window.droneApp.getAppName());
});
