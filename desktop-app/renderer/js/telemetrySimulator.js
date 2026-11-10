
class TelemetrySimulator {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.interval = null;

    this.telemetry = {
      battery: 100,
      altitude: 0,
      speed: 0,
      satellites: 12,
      latitude: 19.0760,
      longitude: 72.8777,
      networkType: "4G LTE",
      signalStrength: 85,
      latency: 45,
      connected: true
    };
  }

  randomChange(value, amount, minimum, maximum) {
    const change = (Math.random() * 2 - 1) * amount;
    return Math.min(maximum, Math.max(minimum, value + change));
  }

  update() {
    const data = this.telemetry;

    data.battery = Math.max(0, data.battery - 0.01);

    data.altitude = this.randomChange(
      data.altitude, 1.5, 0, 120
    );

    data.speed = this.randomChange(
      data.speed, 0.8, 0, 25
    );

    data.satellites = Math.round(
      this.randomChange(data.satellites, 1, 8, 16)
    );

    data.latitude += (Math.random() - 0.5) * 0.00002;
    data.longitude += (Math.random() - 0.5) * 0.00002;

    data.signalStrength = Math.round(
      this.randomChange(data.signalStrength, 4, 30, 100)
    );

    data.latency = Math.round(
      this.randomChange(data.latency, 12, 20, 250)
    );

    this.onUpdate({ ...data });
  }

  start() {
    if (this.interval) return;

    this.update();

    this.interval = setInterval(() => {
      this.update();
    }, 1000);
  }

  stop() {
    if (!this.interval) return;

    clearInterval(this.interval);
    this.interval = null;
  }
}

window.TelemetrySimulator = TelemetrySimulator;
