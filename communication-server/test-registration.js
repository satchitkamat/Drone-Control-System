
const { createDrone } = require("./authentication/droneRegistration");

async function main() {
  try {
    const drone = await createDrone(
      "DRONE-001",
      "DevelopmentDrone@2026!",
      "Test Drone One"
    );

    console.log("Drone registered successfully!");
    console.log("Serial:", drone.serialNumber);
    console.log("Name:", drone.droneName);
    console.log("Database ID:", drone.id);
  } catch (error) {
    console.error("Registration failed:", error.message);
  }
}

main();
