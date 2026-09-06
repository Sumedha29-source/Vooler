import { useState } from "react";
import { translations } from "../translations";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Dashboard({
  farmer,
  onLogout,
  language,
  setLanguage,
}) {
  // ================================
  // TRANSLATION
  // ================================

  const t = translations[language];

  // ================================
  // CURRENT VALUES
  // ================================

  const [temperature, setTemperature] = useState(7.8);
  const [humidity, setHumidity] = useState(76);
  const [power, setPower] = useState(true);
  const [online, setOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  // ================================
  // HISTORY
  // power: 1 = ON, 0 = FAILURE
  // online: 1 = ONLINE, 0 = OFFLINE
  // ================================

  const [history, setHistory] = useState([
    {
      time: "10:00:00 AM",
      temperature: 7.4,
      humidity: 74,
      power: 1,
      online: 1,
    },
    {
      time: "10:05:00 AM",
      temperature: 7.6,
      humidity: 75,
      power: 1,
      online: 1,
    },
    {
      time: "10:10:00 AM",
      temperature: 7.8,
      humidity: 76,
      power: 1,
      online: 1,
    },
  ]);

  // ================================
  // ADD READING
  // ================================

  const addReading = (
    newTemp,
    newHumidity,
    newPower = power,
    newOnline = online
  ) => {
    const now = new Date();

    const time = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setTemperature(newTemp);
    setHumidity(newHumidity);
    setPower(newPower);
    setOnline(newOnline);
    setLastUpdated(time);

    setHistory((previousHistory) => [
      ...previousHistory.slice(-9),
      {
        time,
        temperature: newTemp,
        humidity: newHumidity,
        power: newPower ? 1 : 0,
        online: newOnline ? 1 : 0,
      },
    ]);
  };

  // ================================
  // TEMPERATURE STATUS
  // ================================

  const getTempStatus = (temp) => {
    if (temp >= 5 && temp <= 10) {
      return "SAFE";
    }

    if (
      (temp >= 3 && temp < 5) ||
      (temp > 10 && temp <= 12)
    ) {
      return "WARNING";
    }

    return "UNSAFE";
  };

  // ================================
  // HUMIDITY STATUS
  // ================================

  const getHumidityStatus = (hum) => {
    if (hum >= 70 && hum <= 80) {
      return "SAFE";
    }

    if (
      (hum >= 60 && hum < 70) ||
      (hum > 80 && hum <= 85)
    ) {
      return "WARNING";
    }

    return "UNSAFE";
  };

  const temperatureStatus = getTempStatus(temperature);
  const humidityStatus = getHumidityStatus(humidity);

  // ================================
  // TRANSLATED STATUS TEXT
  // ================================

  const translateStatus = (status) => {
    if (status === "SAFE") {
      return t.safe;
    }

    if (status === "WARNING") {
      return t.attention;
    }

    return t.unsafe;
  };

  // ================================
  // OVERALL STORAGE STATUS
  // ================================

  let overallStatus = "SAFE";

  if (
    temperatureStatus === "UNSAFE" ||
    humidityStatus === "UNSAFE" ||
    power === false ||
    online === false
  ) {
    overallStatus = "UNSAFE";
  } else if (
    temperatureStatus === "WARNING" ||
    humidityStatus === "WARNING"
  ) {
    overallStatus = "ATTENTION";
  }

  // ================================
  // FLUCTUATION DETECTION
  // ================================

  let temperatureFluctuation = false;
  let humidityFluctuation = false;

  let temperatureDifference = 0;
  let humidityDifference = 0;

  if (history.length >= 2) {
    const previous = history[history.length - 2];
    const latest = history[history.length - 1];

    temperatureDifference = Math.abs(
      latest.temperature - previous.temperature
    );

    humidityDifference = Math.abs(
      latest.humidity - previous.humidity
    );

    if (temperatureDifference >= 2) {
      temperatureFluctuation = true;
    }

    if (humidityDifference >= 10) {
      humidityFluctuation = true;
    }
  }

  // ================================
  // PROTOTYPE TEST FUNCTIONS
  // ================================

  const setSafeCondition = () => {
    addReading(7.8, 76, true, true);
  };

  const setTemperatureWarning = () => {
    addReading(11, 76, true, true);
  };

  const setTemperatureDanger = () => {
    addReading(14, 76, true, true);
  };

  const setHumidityDanger = () => {
    addReading(7.8, 90, true, true);
  };

  const setPowerFailure = () => {
    addReading(
      temperature,
      humidity,
      false,
      online
    );
  };

  const setDeviceOffline = () => {
    addReading(
      temperature,
      humidity,
      power,
      false
    );
  };

  return (
    <div className="dashboard-page">

      {/* ================================
          NAVBAR
      ================================ */}

      <nav className="dashboard-navbar">

        <div className="dashboard-logo">
          ❄ VOOLER
        </div>

        <div className="dashboard-nav-right">

          <div className="dashboard-language">

            <button
              type="button"
              onClick={() => setLanguage("bn")}
            >
              বাংলা
            </button>

            <button
              type="button"
              onClick={() => setLanguage("en")}
            >
              English
            </button>

          </div>

          <button onClick={onLogout}>
            {t.logout}
          </button>

        </div>

      </nav>

      <main className="dashboard-main">

        {/* ================================
            FARMER DETAILS
        ================================ */}

        <section className="dashboard-header">

          <div>

            <h1>
              {t.welcome}, {farmer.name}
            </h1>

            <p>
              {t.registeredMobile}: {farmer.phone}
            </p>

            <p>
              {t.storageId}: CS001
            </p>

          </div>

          <div className="device-status">

            <span
              className={
                online
                  ? "online-dot"
                  : "offline-dot"
              }
            ></span>

            {online
              ? t.deviceOnline
              : t.deviceOffline}

          </div>

        </section>

        {/* ================================
            STORAGE CONDITION
        ================================ */}

        <section
          className={`storage-status-card ${overallStatus.toLowerCase()}`}
        >

          <p className="status-title">
            {t.storageCondition}
          </p>

          <h2>

            {overallStatus === "SAFE" &&
              `🟢 ${t.safe}`}

            {overallStatus === "ATTENTION" &&
              `🟡 ${t.attention}`}

            {overallStatus === "UNSAFE" &&
              `🔴 ${t.unsafe}`}

          </h2>

          <p>

            {overallStatus === "SAFE" &&
              t.safeMessage}

            {overallStatus === "ATTENTION" &&
              t.attentionMessage}

            {overallStatus === "UNSAFE" &&
              t.unsafeMessage}

          </p>

        </section>

        {/* ================================
            MONITORING CARDS
        ================================ */}

        <section className="monitoring-grid">

          {/* TEMPERATURE */}

          <div className="monitor-card">

            <div className="card-icon">
              🌡
            </div>

            <h3>
              {t.temperature}
            </h3>

            <div className="sensor-value">
              {temperature}°C
            </div>

            <div
              className={`status-badge ${temperatureStatus.toLowerCase()}`}
            >
              {translateStatus(temperatureStatus)}
            </div>

          </div>

          {/* HUMIDITY */}

          <div className="monitor-card">

            <div className="card-icon">
              💧
            </div>

            <h3>
              {t.humidity}
            </h3>

            <div className="sensor-value">
              {humidity}%
            </div>

            <div
              className={`status-badge ${humidityStatus.toLowerCase()}`}
            >
              {translateStatus(humidityStatus)}
            </div>

          </div>

          {/* POWER */}

          <div className="monitor-card">

            <div className="card-icon">
              ⚡
            </div>

            <h3>
              {t.powerSupply}
            </h3>

            <div className="sensor-value">
              {power ? t.on : t.failure}
            </div>

            <div
              className={`status-badge ${
                power ? "safe" : "unsafe"
              }`}
            >
              {power
                ? t.powerAvailable
                : t.powerFailure}
            </div>

          </div>

          {/* DEVICE */}

          <div className="monitor-card">

            <div className="card-icon">
              📡
            </div>

            <h3>
              {t.deviceStatus}
            </h3>

            <div className="sensor-value device-value">
              {online
                ? t.online
                : t.offline}
            </div>

            <div
              className={`status-badge ${
                online ? "safe" : "unsafe"
              }`}
            >
              {online
                ? t.connected
                : t.noData}
            </div>

          </div>

        </section>

        {/* ================================
            SMART ALERTS
        ================================ */}

        <section className="alerts-section">

          <div className="section-heading">

            <h2>
              🔔 {t.smartAlerts}
            </h2>

            <span>
              {t.liveMonitoring}
            </span>

          </div>

          {overallStatus === "SAFE" &&
            !temperatureFluctuation &&
            !humidityFluctuation && (

              <div className="alert-safe">

                <span>
                  ✅
                </span>

                <div>

                  <h3>
                    {t.noActiveAlerts}
                  </h3>

                  <p>
                    {t.allSafe}
                  </p>

                </div>

              </div>
            )}

          {temperatureStatus === "WARNING" && (

            <div className="alert-warning">
              ⚠️ {t.tempWarning}
            </div>

          )}

          {temperatureStatus === "UNSAFE" && (

            <div className="alert-danger">
              🚨 {t.unsafeTemperature}:{" "}
              {temperature}°C
            </div>

          )}

          {humidityStatus === "WARNING" && (

            <div className="alert-warning">
              ⚠️ {t.humidityWarning}
            </div>

          )}

          {humidityStatus === "UNSAFE" && (

            <div className="alert-danger">
              🚨 {t.unsafeHumidity}:{" "}
              {humidity}%
            </div>

          )}

          {temperatureFluctuation && (

            <div className="alert-warning">
              🌡 {t.tempFluctuation}{" "}
              {t.change}:{" "}
              {temperatureDifference.toFixed(1)}°C
            </div>

          )}

          {humidityFluctuation && (

            <div className="alert-warning">
              💧 {t.humidityFluctuation}{" "}
              {t.change}:{" "}
              {humidityDifference.toFixed(0)}%
            </div>

          )}

          {!power && (

            <div className="alert-danger">
              ⚡ {t.powerFailureDetected}
            </div>

          )}

          {!online && (

            <div className="alert-danger">
              📡 {t.deviceOfflineMessage}
            </div>

          )}

        </section>

        {/* ================================
            FOUR HISTORY GRAPHS
        ================================ */}

        <section className="charts-section">

          {/* TEMPERATURE GRAPH */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                🌡 {t.temperatureHistory}
              </h2>

              <span>
                {t.recent}
              </span>

            </div>

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart data={history}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value) => [
                      `${value} °C`,
                      t.temperature,
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="temperature"
                    strokeWidth={3}
                    dot={true}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* HUMIDITY GRAPH */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                💧 {t.humidityHistory}
              </h2>

              <span>
                {t.recent}
              </span>

            </div>

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart data={history}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value) => [
                      `${value}%`,
                      t.humidity,
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="humidity"
                    strokeWidth={3}
                    dot={true}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* POWER GRAPH */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                ⚡ {t.powerHistory}
              </h2>

              <span>
                1 = {t.on} • 0 = {t.failure}
              </span>

            </div>

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart data={history}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                  />

                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                  />

                  <Tooltip
                    formatter={(value) => [
                      value === 1
                        ? t.powerAvailable
                        : t.powerFailure,
                      t.power,
                    ]}
                  />

                  <Line
                    type="stepAfter"
                    dataKey="power"
                    strokeWidth={3}
                    dot={true}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* DEVICE GRAPH */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                📡 {t.connectivityHistory}
              </h2>

              <span>
                1 = {t.online} • 0 = {t.offline}
              </span>

            </div>

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart data={history}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="time"
                  />

                  <YAxis
                    domain={[0, 1]}
                    ticks={[0, 1]}
                  />

                  <Tooltip
                    formatter={(value) => [
                      value === 1
                        ? t.deviceOnline
                        : t.deviceOffline,
                      t.device,
                    ]}
                  />

                  <Line
                    type="stepAfter"
                    dataKey="online"
                    strokeWidth={3}
                    dot={true}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>

        </section>

        {/* ================================
            RECENT READINGS TABLE
        ================================ */}

        <section className="history-section">

          <div className="section-heading">

            <h2>
              📊 {t.recentReadings}
            </h2>

            <span>
              {history.length} {t.recent}
            </span>

          </div>

          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>

                <tr>

                  <th>
                    {t.time}
                  </th>

                  <th>
                    {t.temperature}
                  </th>

                  <th>
                    {t.humidity}
                  </th>

                  <th>
                    {t.power}
                  </th>

                  <th>
                    {t.device}
                  </th>

                </tr>

              </thead>

              <tbody>

                {[...history]
                  .reverse()
                  .map((reading, index) => (

                    <tr key={index}>

                      <td>
                        {reading.time}
                      </td>

                      <td>
                        {reading.temperature}°C
                      </td>

                      <td>
                        {reading.humidity}%
                      </td>

                      <td>
                        {reading.power === 1
                          ? t.on
                          : t.failure}
                      </td>

                      <td>
                        {reading.online === 1
                          ? t.online
                          : t.offline}
                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        </section>

        {/* ================================
            PROTOTYPE CONTROLS
        ================================ */}

        <section className="test-panel">

          <h2>
            🧪 {t.prototypeControls}
          </h2>

          <p>
            {t.prototypeDescription}
          </p>

          <div className="test-buttons">

            <button
              className="test-safe"
              onClick={setSafeCondition}
            >
              {t.normal}
            </button>

            <button
              onClick={setTemperatureWarning}
            >
              {t.temperatureWarningButton}
            </button>

            <button
              className="test-danger"
              onClick={setTemperatureDanger}
            >
              {t.highTemperature}
            </button>

            <button
              className="test-danger"
              onClick={setHumidityDanger}
            >
              {t.highHumidity}
            </button>

            <button
              className="test-danger"
              onClick={setPowerFailure}
            >
              {t.powerFailureButton}
            </button>

            <button
              className="test-danger"
              onClick={setDeviceOffline}
            >
              {t.deviceOfflineButton}
            </button>

          </div>

        </section>

        {/* ================================
            LAST UPDATE
        ================================ */}

        <section className="last-update-card">

          <span>
            📡
          </span>

          <p>
            {t.lastDataReceived}:
            <strong>
              {" "}
              {lastUpdated}
            </strong>
          </p>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;