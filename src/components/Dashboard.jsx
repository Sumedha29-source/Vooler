function Dashboard({ farmer, onLogout }) {
  // Dummy data for now
  const sensorData = {
    temperature: 7.8,
    humidity: 76,
    power: true,
    online: true,
    lastUpdated: "Just now",
  };

  const getTempStatus = (temp) => {
    if (temp >= 5 && temp <= 10) return "SAFE";

    if (
      (temp >= 3 && temp < 5) ||
      (temp > 10 && temp <= 12)
    ) {
      return "WARNING";
    }

    return "UNSAFE";
  };

  const getHumidityStatus = (humidity) => {
    if (humidity >= 70 && humidity <= 80) return "SAFE";

    if (
      (humidity >= 60 && humidity < 70) ||
      (humidity > 80 && humidity <= 85)
    ) {
      return "WARNING";
    }

    return "UNSAFE";
  };

  const temperatureStatus =
    getTempStatus(sensorData.temperature);

  const humidityStatus =
    getHumidityStatus(sensorData.humidity);

  let overallStatus = "SAFE";

  if (
    temperatureStatus === "UNSAFE" ||
    humidityStatus === "UNSAFE" ||
    sensorData.power === false ||
    sensorData.online === false
  ) {
    overallStatus = "UNSAFE";
  } else if (
    temperatureStatus === "WARNING" ||
    humidityStatus === "WARNING"
  ) {
    overallStatus = "ATTENTION";
  }

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}
      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          ❄ VOOLER
        </div>

        <div className="dashboard-nav-right">
          <span>বাংলা | English</span>

          <button onClick={onLogout}>
            Logout
          </button>
        </div>

      </nav>


      <main className="dashboard-main">

        {/* USER INFO */}
        <section className="dashboard-header">

          <div>
            <h1>
              Welcome, {farmer.name}
            </h1>

            <p>
              Registered Mobile: {farmer.phone}
            </p>

            <p>
              Storage ID: CS001
            </p>
          </div>

          <div className="device-status">
            <span className="online-dot"></span>

            Device Online
          </div>

        </section>


        {/* OVERALL STORAGE STATUS */}
        <section
          className={`storage-status-card ${overallStatus.toLowerCase()}`}
        >
          <p className="status-title">
            STORAGE CONDITION
          </p>

          <h2>
            {overallStatus === "SAFE" && "🟢 SAFE"}

            {overallStatus === "ATTENTION" &&
              "🟡 ATTENTION"}

            {overallStatus === "UNSAFE" &&
              "🔴 UNSAFE"}
          </h2>

          <p>
            {overallStatus === "SAFE"
              ? "Cold storage conditions are currently normal."
              : "Please check the storage parameters."}
          </p>
        </section>


        {/* SENSOR CARDS */}
        <section className="monitoring-grid">

          {/* TEMPERATURE */}
          <div className="monitor-card">

            <div className="card-icon">🌡</div>

            <h3>Temperature</h3>

            <div className="sensor-value">
              {sensorData.temperature}°C
            </div>

            <div
              className={`status-badge ${temperatureStatus.toLowerCase()}`}
            >
              {temperatureStatus}
            </div>

          </div>


          {/* HUMIDITY */}
          <div className="monitor-card">

            <div className="card-icon">💧</div>

            <h3>Humidity</h3>

            <div className="sensor-value">
              {sensorData.humidity}%
            </div>

            <div
              className={`status-badge ${humidityStatus.toLowerCase()}`}
            >
              {humidityStatus}
            </div>

          </div>


          {/* POWER */}
          <div className="monitor-card">

            <div className="card-icon">⚡</div>

            <h3>Power Supply</h3>

            <div className="sensor-value">
              {sensorData.power ? "ON" : "OFF"}
            </div>

            <div
              className={`status-badge ${
                sensorData.power
                  ? "safe"
                  : "unsafe"
              }`}
            >
              {sensorData.power
                ? "POWER AVAILABLE"
                : "POWER FAILURE"}
            </div>

          </div>


          {/* DEVICE */}
          <div className="monitor-card">

            <div className="card-icon">📡</div>

            <h3>Device Status</h3>

            <div className="sensor-value device-value">
              {sensorData.online
                ? "ONLINE"
                : "OFFLINE"}
            </div>

            <div
              className={`status-badge ${
                sensorData.online
                  ? "safe"
                  : "unsafe"
              }`}
            >
              {sensorData.online
                ? "CONNECTED"
                : "NO DATA"}
            </div>

          </div>

        </section>


        {/* SMART ALERTS */}
        <section className="alerts-section">

          <div className="section-heading">
            <h2>🔔 Smart Alerts</h2>

            <span>Live monitoring</span>
          </div>

          {overallStatus === "SAFE" ? (

            <div className="alert-safe">
              <span>✅</span>

              <div>
                <h3>No Active Alerts</h3>

                <p>
                  All monitored conditions are within
                  the safe range.
                </p>
              </div>
            </div>

          ) : (

            <div className="alert-danger">
              <span>⚠️</span>

              <div>
                <h3>
                  Storage Warning
                </h3>

                <p>
                  An unsafe condition has been
                  detected.
                </p>
              </div>
            </div>

          )}

        </section>


        {/* LAST UPDATE */}
        <section className="last-update-card">

          <span>📡</span>

          <p>
            Last data received:
            <strong>
              {" "}{sensorData.lastUpdated}
            </strong>
          </p>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;