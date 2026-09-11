import { useEffect, useState } from "react";
import { translations } from "../translations";
import { API_BASE_URL } from "../config";

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
  const t = translations[language] || translations.en;

  // =====================================================
  // SENSOR DATA
  // =====================================================

  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [power, setPower] = useState(false);
  const [online, setOnline] = useState(false);

  const [lastUpdated, setLastUpdated] =
    useState("Waiting for data...");

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/dashboard/${farmer.storageId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load dashboard"
          );
        }

        // Latest reading
        if (data.latest) {
          setTemperature(data.latest.temperature);
          setHumidity(data.latest.humidity);
          setPower(data.latest.power);
          setOnline(data.latest.online);

          const date = new Date(data.latest.timestamp);

          setLastUpdated(
            date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        } else {
          setOnline(false);
        }

        // History
        const formattedHistory = (data.history || []).map(
          (reading) => {
            const date = new Date(reading.timestamp);

            return {
              time: date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),

              timestamp: reading.timestamp,
              temperature: reading.temperature,
              humidity: reading.humidity,

              power: reading.power ? 1 : 0,

              online: 1,
            };
          }
        );

        setHistory(formattedHistory);
        setError("");
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        setOnline(false);

        setError(
          language === "bn"
            ? "স্টোরেজ ডেটা পাওয়া যাচ্ছে না।"
            : language === "hi"
            ? "स्टोरेज डेटा प्राप्त नहीं हो रहा है।"
            : language === "as"
            ? "ষ্টোৰেজ ডেটা পোৱা নাই।"
            : "Unable to receive storage data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    const interval = setInterval(
      fetchDashboardData,
      10000
    );

    return () => clearInterval(interval);
  }, [farmer.storageId, language]);

  // =====================================================
// TEMPERATURE STORAGE CONDITION
//
// SAFE    : temp < 23°C
// WARNING : 23°C to 30°C
// UNSAFE  : temp > 30°C
// =====================================================

const getTempStatus = (temp) => {

  if (temp < 23) {
    return "SAFE";
  }

  if (
    temp >= 23 &&
    temp <= 30
  ) {
    return "WARNING";
  }

  return "UNSAFE";
};

  // =====================================================
// HUMIDITY STORAGE CONDITION
//
// UNSAFE  : humidity < 45%
// WARNING : 45% to <50%
// SAFE    : 50% to 65%
// WARNING : >65%
//
// =====================================================

const getHumidityStatus = (hum) => {

  if (hum < 45) {
    return "UNSAFE";
  }

  if (
    hum >= 50 &&
    hum <= 65
  ) {
    return "SAFE";
  }

  return "WARNING";
};

  // =====================================================
  // CALCULATE CURRENT SENSOR STATUS
  // =====================================================

  const temperatureStatus =
    getTempStatus(temperature);

  const humidityStatus =
    getHumidityStatus(humidity);
  // =====================================================
  // TRANSLATED STATUS
  // =====================================================

  const translateStatus = (status) => {
    if (status === "SAFE") {
      return t.safe;
    }

    if (status === "WARNING") {
      return t.attention;
    }

    return t.unsafe;
  };

  // =====================================================
  // OVERALL STORAGE STATUS
  // =====================================================

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

  // =====================================================
  // FLUCTUATION DETECTION
  // =====================================================

  let temperatureFluctuation = false;
  let humidityFluctuation = false;

  let temperatureDifference = 0;
  let humidityDifference = 0;

  if (history.length >= 2) {
    const previous =
      history[history.length - 2];

    const latest =
      history[history.length - 1];

    temperatureDifference = Math.abs(
      latest.temperature -
        previous.temperature
    );

    humidityDifference = Math.abs(
      latest.humidity -
        previous.humidity
    );

    if (temperatureDifference >= 2) {
      temperatureFluctuation = true;
    }

    if (humidityDifference >= 10) {
      humidityFluctuation = true;
    }
  }

  // =====================================================
  // CONNECTIVITY HISTORY
  // =====================================================

  const connectivityHistory = [...history];

  if (
    history.length > 0 &&
    online === false
  ) {
    const latest =
      history[history.length - 1];

    connectivityHistory.push({
      ...latest,

      time:
        language === "bn"
          ? "এখন"
          : language === "hi"
          ? "अभी"
          : language === "as"
          ? "এতিয়া"
          : "Now",

      online: 0,
    });
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-main">
          <h2>
            {language === "bn"
              ? "VOOLER ডেটা লোড হচ্ছে..."
              : language === "hi"
              ? "VOOLER डेटा लोड हो रहा है..."
              : language === "as"
              ? "VOOLER ডেটা লোড হৈ আছে..."
              : "Loading VOOLER data..."}
          </h2>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* NAVBAR */}

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

            <button
              type="button"
              onClick={() => setLanguage("hi")}
            >
              हिन्दी
            </button>

            <button
              type="button"
              onClick={() => setLanguage("as")}
            >
              অসমীয়া
            </button>

          </div>

          <button onClick={onLogout}>
            {t.logout}
          </button>

        </div>

      </nav>

      <main className="dashboard-main">

        {/* SERVER ERROR */}

        {error && (
          <div className="alert-danger">
            📡 {error}
          </div>
        )}

        {/* FARMER INFORMATION */}

        <section className="dashboard-header">

          <div>

            <h1>
              {t.welcome}, {farmer.name}
            </h1>

            <p>
              {t.registeredMobile}:{" "}
              {farmer.phone}
            </p>

            <p>
              {t.storageId}:{" "}
              {farmer.storageId}
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

        {/* STORAGE CONDITION */}

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

        {/* MONITORING CARDS */}

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
              {translateStatus(
                temperatureStatus
              )}
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
              {translateStatus(
                humidityStatus
              )}
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
              {power
                ? t.on
                : t.failure}
            </div>

            <div
              className={`status-badge ${
                power
                  ? "safe"
                  : "unsafe"
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
                online
                  ? "safe"
                  : "unsafe"
              }`}
            >

              {online
                ? t.connected
                : t.noData}

            </div>

          </div>

        </section>

        {/* SMART ALERTS */}

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

                <span>✅</span>

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

          {temperatureStatus ===
            "WARNING" && (

            <div className="alert-warning">
              ⚠️ {t.tempWarning}
            </div>

          )}

          {temperatureStatus ===
            "UNSAFE" && (

            <div className="alert-danger">

              🚨 {t.unsafeTemperature}:{" "}
              {temperature}°C

            </div>

          )}

          {humidityStatus ===
            "WARNING" && (

            <div className="alert-warning">
              ⚠️ {t.humidityWarning}
            </div>

          )}

          {humidityStatus ===
            "UNSAFE" && (

            <div className="alert-danger">

              🚨 {t.unsafeHumidity}:{" "}
              {humidity}%

            </div>

          )}

          {temperatureFluctuation && (

            <div className="alert-warning">

              🌡 {t.tempFluctuation}{" "}
              {t.change}:{" "}
              {temperatureDifference.toFixed(
                1
              )}
              °C

            </div>

          )}

          {humidityFluctuation && (

            <div className="alert-warning">

              💧 {t.humidityFluctuation}{" "}
              {t.change}:{" "}
              {humidityDifference.toFixed(
                0
              )}
              %

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

        {/* GRAPHS */}

        <section className="charts-section">

          {/* TEMPERATURE */}

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

          {/* HUMIDITY */}

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

          {/* POWER */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                ⚡ {t.powerHistory}
              </h2>

              <span>
                1 = {t.on} • 0 ={" "}
                {t.failure}
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

          {/* CONNECTIVITY */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                📡 {t.connectivityHistory}
              </h2>

              <span>
                1 = {t.online} • 0 ={" "}
                {t.offline}
              </span>

            </div>

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart
                  data={
                    connectivityHistory
                  }
                >

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

        {/* RECENT READINGS */}

        <section className="history-section">

          <div className="section-heading">

            <h2>
              📊 {t.recentReadings}
            </h2>

            <span>
              {history.length}{" "}
              {t.recent}
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
                  .map(
                    (reading, index) => (

                      <tr
                        key={
                          reading.timestamp ||
                          index
                        }
                      >

                        <td>
                          {reading.time}
                        </td>

                        <td>
                          {reading.temperature}
                          °C
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
                          {t.online}
                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

        </section>

        {/* LAST DATA RECEIVED */}

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