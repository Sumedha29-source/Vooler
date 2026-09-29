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
  Legend,
  ResponsiveContainer,
} from "recharts";


function Dashboard({
  farmer,
  onLogout,
  language,
  setLanguage,
}) {

  const t =
    translations[language] ||
    translations.en;


  // =====================================================
  // DOOR ACCESS PIN
  // =====================================================

  const [devicePin, setDevicePin] = useState("");
  const [showDevicePin, setShowDevicePin] = useState(false);
  const [devicePinLoading, setDevicePinLoading] = useState(false);
  const [devicePinError, setDevicePinError] = useState("");

  const handleDevicePinToggle = async () => {
    if (showDevicePin) {
      setShowDevicePin(false);
      return;
    }

    if (devicePin) {
      setShowDevicePin(true);
      return;
    }

    try {
      setDevicePinLoading(true);
      setDevicePinError("");

      const response = await fetch(`${API_BASE_URL}/api/auth/device-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmerId: farmer.id,
          phone: farmer.phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load device PIN");
      }

      setDevicePin(data.devicePin || "");
      setShowDevicePin(true);
    } catch (err) {
      console.error("Device PIN fetch error:", err);
      setDevicePinError(err.message || "Unable to load device PIN");
    } finally {
      setDevicePinLoading(false);
    }
  };


  // =====================================================
  // SENSOR DATA
  // =====================================================

  const [showCoolingBackupInfo, setShowCoolingBackupInfo] = useState(false);
  const [
    chamber1Temperature,
    setChamber1Temperature,
  ] = useState(null);


  const [
    chamber2Temperature,
    setChamber2Temperature,
  ] = useState(null);


  // =====================================================
  // SET TEMPERATURES
  // =====================================================

  const [
    chamber1SetTemperature,
    setChamber1SetTemperature,
  ] = useState(null);


  const [
    chamber2SetTemperature,
    setChamber2SetTemperature,
  ] = useState(null);


  const [
    humidity,
    setHumidity,
  ] = useState(0);


  const [
    power,
    setPower,
  ] = useState(false);


  const [
    online,
    setOnline,
  ] = useState(false);


  const [
    lastUpdated,
    setLastUpdated,
  ] = useState(
    "Waiting for data..."
  );


  const [
    history,
    setHistory,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // =====================================================
  // EMERGENCY CONTROL
  // =====================================================

  const [
    emergencyShutdown,
    setEmergencyShutdown,
  ] = useState(false);


  const [
    emergencyLoading,
    setEmergencyLoading,
  ] = useState(false);


  const [
    emergencyError,
    setEmergencyError,
  ] = useState("");


  // =====================================================
  // WEATHER & ENERGY PLANNING
  // =====================================================

  const [weatherForecast, setWeatherForecast] = useState([]);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");



  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  useEffect(() => {

    const fetchDashboardData =
      async () => {

        try {

          const response =
            await fetch(
              `${API_BASE_URL}/api/dashboard/${farmer.storageId}`
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.message ||
              "Unable to load dashboard"
            );

          }


          // ===============================================
          // LATEST DATA
          // ===============================================

          if (data.latest) {

            setChamber1Temperature(

              typeof data.latest
                .chamber1Temperature ===
              "number"

                ? data.latest
                    .chamber1Temperature

                : null

            );


            setChamber2Temperature(

              typeof data.latest
                .chamber2Temperature ===
              "number"

                ? data.latest
                    .chamber2Temperature

                : null

            );


            setChamber1SetTemperature(
              typeof data.latest.chamber1SetTemperature === "number"
                ? data.latest.chamber1SetTemperature
                : null
            );


            setChamber2SetTemperature(
              typeof data.latest.chamber2SetTemperature === "number"
                ? data.latest.chamber2SetTemperature
                : null
            );


            setHumidity(

              typeof data.latest
                .humidity ===
              "number"

                ? data.latest.humidity

                : 0

            );


            setPower(
              data.latest.power ===
              true
            );


            setOnline(
              data.latest.online ===
              true
            );


            const rawTime =
              data.latest.timestamp ||
              data.latest.createdAt;


            if (rawTime) {

              const date =
                new Date(
                  rawTime
                );


              setLastUpdated(

                date.toLocaleTimeString(
                  [],
                  {
                    hour:
                      "2-digit",

                    minute:
                      "2-digit",

                    second:
                      "2-digit",
                  }
                )

              );

            }

          }
          else {

            setOnline(false);

          }


          // ===============================================
          // HISTORY
          // ===============================================

          const formattedHistory =
            (
              data.history || []
            ).map(
              (reading) => {

                const rawTime =
                  reading.timestamp ||
                  reading.createdAt;


                const date =
                  rawTime
                    ? new Date(
                        rawTime
                      )
                    : new Date();


                return {

                  time:
                    date.toLocaleTimeString(
                      [],
                      {
                        hour:
                          "2-digit",

                        minute:
                          "2-digit",

                        second:
                          "2-digit",
                      }
                    ),


                  timestamp:
                    rawTime,


                  chamber1Temperature:

                    typeof reading
                      .chamber1Temperature ===
                    "number"

                      ? reading
                          .chamber1Temperature

                      : null,


                  chamber2Temperature:

                    typeof reading
                      .chamber2Temperature ===
                    "number"

                      ? reading
                          .chamber2Temperature

                      : null,


                  humidity:

                    typeof reading
                      .humidity ===
                    "number"

                      ? reading.humidity

                      : 0,


                  power:
                    reading.power
                      ? 1
                      : 0,


                  online:

                    reading.online ===
                    false

                      ? 0

                      : 1,

                };

              }
            );


          setHistory(
            formattedHistory
          );


          setError("");

        }
        catch (err) {

          console.error(
            "Dashboard fetch error:",
            err
          );


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

        }
        finally {

          setLoading(false);

        }

      };


    fetchDashboardData();


    const interval =
      setInterval(
        fetchDashboardData,
        10000
      );


    return () =>
      clearInterval(
        interval
      );

  }, [
    farmer.storageId,
    language,
  ]);


  // =====================================================
  // FETCH WEATHER FORECAST
  // =====================================================

  useEffect(() => {
    const fetchWeatherForecast = async () => {
      try {
        setWeatherLoading(true);

        const response = await fetch(
          `${API_BASE_URL}/api/weather/${farmer.storageId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Weather forecast temporarily unavailable."
          );
        }

        setWeatherForecast(
          Array.isArray(data.forecast) ? data.forecast : []
        );

        setWeatherLocation(
          data.location?.placeName || farmer.storageId
        );

        setWeatherError("");
      } catch (err) {
        console.error("Weather forecast fetch error:", err);
        setWeatherForecast([]);
        setWeatherError(
          "Weather forecast temporarily unavailable."
        );
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeatherForecast();

    // Forecast data does not need the 5-10 second polling used by sensors.
    // Refresh once every 30 minutes while the dashboard remains open.
    const interval = setInterval(
      fetchWeatherForecast,
      30 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [farmer.storageId]);


  // =====================================================
  // FETCH EMERGENCY STATE
  // =====================================================

  useEffect(() => {

    const fetchEmergencyState =
      async () => {

        try {

          const response =
            await fetch(
              `${API_BASE_URL}/api/device-control/${farmer.storageId}`
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.message ||
              "Unable to load emergency state"
            );

          }


          setEmergencyShutdown(
            Boolean(
              data.emergencyShutdown
            )
          );


          setEmergencyError("");

        }
        catch (err) {

          console.error(
            "Emergency state fetch error:",
            err
          );


          setEmergencyError(
            "Unable to receive emergency-control status."
          );

        }

      };


    fetchEmergencyState();


    const interval =
      setInterval(
        fetchEmergencyState,
        5000
      );


    return () =>
      clearInterval(
        interval
      );

  }, [
    farmer.storageId,
  ]);


  // =====================================================
  // EMERGENCY SHUTDOWN
  // =====================================================

  const handleEmergencyShutdown =
    async () => {

      const confirmed =
        window.confirm(
          "EMERGENCY SHUTDOWN\n\n" +
          "This will immediately command the VOOLER cooling system to stop.\n\n" +
          "Do you want to continue?"
        );


      if (!confirmed) {

        return;

      }


      try {

        setEmergencyLoading(
          true
        );

        setEmergencyError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/device-control/shutdown`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  phone:
                    farmer.phone,

                  storageId:
                    farmer.storageId,
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Emergency shutdown failed"
          );

        }


        setEmergencyShutdown(
          true
        );


        window.alert(
          "Emergency shutdown activated."
        );

      }
      catch (err) {

        console.error(
          "Emergency shutdown error:",
          err
        );


        setEmergencyError(

          err.message ||
          "Unable to activate emergency shutdown."

        );

      }
      finally {

        setEmergencyLoading(
          false
        );

      }

    };


  // =====================================================
  // RESUME SYSTEM
  // =====================================================

  const handleResumeSystem =
    async () => {

      const confirmed =
        window.confirm(
          "Resume the VOOLER cooling system?"
        );


      if (!confirmed) {

        return;

      }


      try {

        setEmergencyLoading(
          true
        );

        setEmergencyError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/device-control/resume`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  phone:
                    farmer.phone,

                  storageId:
                    farmer.storageId,
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to resume system"
          );

        }


        setEmergencyShutdown(
          false
        );


        window.alert(
          "VOOLER cooling system resumed."
        );

      }
      catch (err) {

        console.error(
          "Resume system error:",
          err
        );


        setEmergencyError(

          err.message ||
          "Unable to resume the system."

        );

      }
      finally {

        setEmergencyLoading(
          false
        );

      }

    };


  // =====================================================
  // TEMPERATURE STATUS
  // =====================================================

  const getTempStatus =
    (temperature) => {

      if (
        typeof temperature !==
        "number"
      ) {

        return "NO_DATA";

      }


      if (
        temperature < 23
      ) {

        return "SAFE";

      }


      if (
        temperature >= 23 &&
        temperature <= 30
      ) {

        return "WARNING";

      }


      return "UNSAFE";

    };


  // =====================================================
  // HUMIDITY STATUS
  // =====================================================

  const getHumidityStatus =
    (hum) => {

      if (
        hum >= 85
      ) {

        return "EXCELLENT";

      }


      return "ATTENTION";

    };


  // =====================================================
  // CURRENT STATUS
  // =====================================================

  const chamber1Status =
    getTempStatus(
      chamber1Temperature
    );


  const chamber2Status =
    getTempStatus(
      chamber2Temperature
    );


  const humidityStatus =
    getHumidityStatus(
      humidity
    );


  // =====================================================
  // TRANSLATE STATUS
  // =====================================================

  const translateStatus =
    (status) => {

      if (
        status === "SAFE"
      ) {

        return t.safe;

      }


      if (
        status === "WARNING"
      ) {

        return t.attention;

      }


      if (
        status === "NO_DATA"
      ) {

        return "Waiting for data";

      }


      return t.unsafe;

    };


  const getStatusClass =
    (status) => {

      if (
        status === "NO_DATA"
      ) {

        return "warning";

      }


      return status.toLowerCase();

    };


  // =====================================================
  // OVERALL STATUS
  // =====================================================

  let overallStatus =
    "SAFE";


  if (

    chamber1Status ===
      "UNSAFE" ||

    chamber2Status ===
      "UNSAFE" ||

    power === false ||

    online === false

  ) {

    overallStatus =
      "UNSAFE";

  }
  else if (

    chamber1Status ===
      "WARNING" ||

    chamber2Status ===
      "WARNING" ||

    chamber1Status ===
      "NO_DATA" ||

    chamber2Status ===
      "NO_DATA" ||

    humidityStatus ===
      "ATTENTION"

  ) {

    overallStatus =
      "ATTENTION";

  }


  // =====================================================
  // FLUCTUATION DETECTION
  // =====================================================

  let chamber1Fluctuation =
    false;

  let chamber2Fluctuation =
    false;

  let humidityFluctuation =
    false;


  let chamber1Difference =
    0;

  let chamber2Difference =
    0;

  let humidityDifference =
    0;


  if (
    history.length >= 2
  ) {

    const previous =
      history[
        history.length - 2
      ];


    const latest =
      history[
        history.length - 1
      ];


    if (

      typeof latest
        .chamber1Temperature ===
        "number" &&

      typeof previous
        .chamber1Temperature ===
        "number"

    ) {

      chamber1Difference =
        Math.abs(

          latest
            .chamber1Temperature -

          previous
            .chamber1Temperature

        );


      if (
        chamber1Difference >= 2
      ) {

        chamber1Fluctuation =
          true;

      }

    }


    if (

      typeof latest
        .chamber2Temperature ===
        "number" &&

      typeof previous
        .chamber2Temperature ===
        "number"

    ) {

      chamber2Difference =
        Math.abs(

          latest
            .chamber2Temperature -

          previous
            .chamber2Temperature

        );


      if (
        chamber2Difference >= 2
      ) {

        chamber2Fluctuation =
          true;

      }

    }


    humidityDifference =
      Math.abs(

        latest.humidity -

        previous.humidity

      );


    if (
      humidityDifference >= 10
    ) {

      humidityFluctuation =
        true;

    }

  }


  // =====================================================
  // GRAPH TABS
  // =====================================================

  const [activeGraph, setActiveGraph] = useState("temperature");
  const [showRecentReadings, setShowRecentReadings] = useState(false);


  // =====================================================
  // CONNECTIVITY HISTORY
  // =====================================================

  const connectivityHistory =
    [...history];


  if (
    history.length > 0 &&
    online === false
  ) {

    const latest =
      history[
        history.length - 1
      ];


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
  // WEATHER DISPLAY HELPERS
  // =====================================================

  const getWeatherIcon = (condition = "") => {
    const value = condition.toLowerCase();

    if (value.includes("thunder")) return "⛈️";
    if (value.includes("snow")) return "❄️";
    if (
      value.includes("rain") ||
      value.includes("drizzle") ||
      value.includes("shower")
    ) {
      return "🌧️";
    }
    if (value.includes("fog")) return "🌫️";
    if (
      value.includes("cloud") ||
      value.includes("overcast")
    ) {
      return "☁️";
    }

    return "☀️";
  };


  const getForecastDayLabel = (dateString, index) => {
    if (index === 0) return "Today";
    if (index === 1) return "Tomorrow";

    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return `Day ${index + 1}`;
    }

    return date.toLocaleDateString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };


  const getSolarBadgeStyle = (availability) => {
    if (availability === "HIGH") {
      return {
        background: "#e9f8ef",
        color: "#176b3a",
        border: "1px solid #b8e2c7",
      };
    }

    if (availability === "MODERATE") {
      return {
        background: "#fff7df",
        color: "#8a5a00",
        border: "1px solid #f0d58a",
      };
    }

    return {
      background: "#f2f4f7",
      color: "#475467",
      border: "1px solid #d0d5dd",
    };
  };


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
              onClick={() =>
                setLanguage("bn")
              }
            >
              বাংলা
            </button>


            <button
              type="button"
              onClick={() =>
                setLanguage("en")
              }
            >
              English
            </button>


            <button
              type="button"
              onClick={() =>
                setLanguage("hi")
              }
            >
              हिन्दी
            </button>


            <button
              type="button"
              onClick={() =>
                setLanguage("as")
              }
            >
              অসমীয়া
            </button>

          </div>


          <button
            onClick={
              onLogout
            }
          >
            {t.logout}
          </button>

        </div>

      </nav>


      <main className="dashboard-main">


        {/* ERROR */}

        {error && (

          <div className="alert-danger">

            📡 {error}

          </div>

        )}


        {/* FARMER */}

        <section className="dashboard-header">

          <div>

            <h1>

              {t.welcome},{" "}
              {farmer.name}

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


        {/* =================================================
            DOOR ACCESS PIN
        ================================================= */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dfe8e6",
            borderRadius: "16px",
            padding: "18px 20px",
            marginTop: "18px",
            marginBottom: "18px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                🔐 Door Access PIN
              </h2>

              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  opacity: 0.68,
                }}
              >
                Use this PIN on the VOOLER door keypad.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                aria-label={showDevicePin ? "Device PIN visible" : "Device PIN hidden"}
                style={{
                  minWidth: "100px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#f6f9f8",
                  border: "1px solid #dfe8e6",
                  textAlign: "center",
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "6px",
                }}
              >
                {devicePinLoading
                  ? "...."
                  : showDevicePin && devicePin
                  ? devicePin
                  : "••••"}
              </div>

              <button
                type="button"
                onClick={handleDevicePinToggle}
                disabled={devicePinLoading}
                aria-label={showDevicePin ? "Hide door access PIN" : "Show door access PIN"}
                title={showDevicePin ? "Hide PIN" : "Show PIN"}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  border: "1px solid #d6e2df",
                  background: "#ffffff",
                  cursor: devicePinLoading ? "wait" : "pointer",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {showDevicePin ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {devicePinError && (
            <div
              style={{
                marginTop: "12px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#b42318",
              }}
            >
              ⚠️ {devicePinError}
            </div>
          )}
        </section>


        {/* STORAGE CONDITION */}

        <section

          className={
            `storage-status-card ${overallStatus.toLowerCase()}`
          }

        >

          <p className="status-title">

            {t.storageCondition}

          </p>


          <h2>

            {overallStatus ===
              "SAFE" &&
              `🟢 ${t.safe}`}


            {overallStatus ===
              "ATTENTION" &&
              `🟡 ${t.attention}`}


            {overallStatus ===
              "UNSAFE" &&
              `🔴 ${t.unsafe}`}

          </h2>


          <p>

            {overallStatus ===
              "SAFE" &&
              t.safeMessage}


            {overallStatus ===
              "ATTENTION" &&
              t.attentionMessage}


            {overallStatus ===
              "UNSAFE" &&
              t.unsafeMessage}

          </p>

        </section>


        {/* =================================================
            HUMIDITY / POWER / DEVICE
        ================================================= */}

        <section className="monitoring-grid-top">


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
              className={
                `status-badge ${
                  humidityStatus === "EXCELLENT"
                    ? "safe"
                    : "warning"
                }`
              }
            >

              {humidityStatus === "EXCELLENT"
                ? "EXCELLENT"
                : "ATTENTION"}

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
              className={
                `status-badge ${
                  power
                    ? "safe"
                    : "unsafe"
                }`
              }
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
              className={
                `status-badge ${
                  online
                    ? "safe"
                    : "unsafe"
                }`
              }
            >

              {online
                ? t.connected
                : t.noData}

            </div>

          </div>

        </section>


        {/* =================================================
            CHAMBERS
        ================================================= */}

        <section className="chamber-grid">

          {/* CHAMBER 1 */}
          <div className="monitor-card chamber-card">
            <div className="card-icon">🌡</div>
            <h3>Chamber 1</h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              width: "100%",
              marginTop: "12px",
              marginBottom: "18px",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.7, marginBottom: "10px" }}>
                  SET TEMPERATURE
                </div>
                <div className="sensor-value chamber-temperature-value">
                  {chamber1SetTemperature !== null
                    ? `${chamber1SetTemperature}°C`
                    : "-- °C"}
                </div>
              </div>

              <div style={{
                textAlign: "center",
                borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
                paddingLeft: "20px",
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.7, marginBottom: "10px" }}>
                  CURRENT TEMPERATURE
                </div>
                <div className="sensor-value chamber-temperature-value">
                  {chamber1Temperature !== null
                    ? `${chamber1Temperature}°C`
                    : "-- °C"}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    opacity: 0.65,
                  }}
                >
                  Approx. time to reach
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  ---- hrs
                </div>
              </div>
            </div>

            <div className={`status-badge ${getStatusClass(chamber1Status)}`}>
              {translateStatus(chamber1Status)}
            </div>
          </div>

          {/* CHAMBER 2 */}
          <div className="monitor-card chamber-card">
            <div className="card-icon">🌡</div>
            <h3>Chamber 2</h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              width: "100%",
              marginTop: "12px",
              marginBottom: "18px",
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.7, marginBottom: "10px" }}>
                  SET TEMPERATURE
                </div>
                <div className="sensor-value chamber-temperature-value">
                  {chamber2SetTemperature !== null
                    ? `${chamber2SetTemperature}°C`
                    : "-- °C"}
                </div>
              </div>

              <div style={{
                textAlign: "center",
                borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
                paddingLeft: "20px",
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, opacity: 0.7, marginBottom: "10px" }}>
                  CURRENT TEMPERATURE
                </div>
                <div className="sensor-value chamber-temperature-value">
                  {chamber2Temperature !== null
                    ? `${chamber2Temperature}°C`
                    : "-- °C"}
                </div>

                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    opacity: 0.65,
                  }}
                >
                  Approx. time to reach
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  ---- hrs
                </div>
              </div>
            </div>

            <div className={`status-badge ${getStatusClass(chamber2Status)}`}>
              {translateStatus(chamber2Status)}
            </div>
          </div>

        </section>


        {/* =================================================
            WEATHER & ENERGY PLANNING
        ================================================= */}

        <section
          className="chart-card"
          style={{
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <div className="section-heading">
            <div>
              <h2>☀️ Weather & Energy Planning</h2>
              <span>
                {weatherLocation
                  ? `Forecast for ${weatherLocation}`
                  : "Storage-site forecast"}
              </span>
            </div>

            <span>4-day solar planning</span>
          </div>

          {weatherLoading && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                opacity: 0.7,
                fontWeight: 600,
              }}
            >
              Loading weather forecast...
            </div>
          )}

          {!weatherLoading && weatherError && (
            <div className="alert-warning">
              ☁️ {weatherError}
            </div>
          )}

          {!weatherLoading &&
            !weatherError &&
            weatherForecast.length > 0 && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "12px",
                    marginTop: "16px",
                  }}
                >
                  {weatherForecast.map((day, index) => (
                    <div
                      key={day.date || index}
                      style={{
                        border: "1px solid #e2e8e6",
                        borderRadius: "14px",
                        padding: "16px",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: "15px",
                            }}
                          >
                            {getForecastDayLabel(
                              day.date,
                              index
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: "3px",
                              fontSize: "12px",
                              opacity: 0.6,
                            }}
                          >
                            {day.date}
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: "30px",
                            lineHeight: 1,
                          }}
                        >
                          {getWeatherIcon(day.condition)}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {day.condition || "Forecast"}
                      </div>

                      <div
                        style={{
                          marginTop: "10px",
                          fontSize: "20px",
                          fontWeight: 800,
                        }}
                      >
                        {day.temperature?.max ?? "--"}°C
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 600,
                            opacity: 0.6,
                          }}
                        >
                          {" "}
                          / {day.temperature?.min ?? "--"}°C
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: "12px",
                          display: "grid",
                          gap: "6px",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          🌧️ Chance of rain:{" "}
                          <strong>
                            {day.precipitationProbability ??
                              "--"}
                            %
                          </strong>
                        </div>

                        <div>
                          ☁️ Cloud cover:{" "}
                          <strong>
                            {day.cloudCover ?? "--"}%
                          </strong>
                        </div>

                        <div>
                          ☀️ Sunshine:{" "}
                          <strong>
                            {day.sunshineHours ?? "--"} hrs
                          </strong>
                        </div>

                        <div>
                          🔆 Solar energy:{" "}
                          <strong>
                            {day.solarRadiation ?? "--"} MJ/m²
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "inline-block",
                          marginTop: "14px",
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "11px",
                          fontWeight: 800,
                          letterSpacing: "0.3px",
                          ...getSolarBadgeStyle(
                            day.solarAvailability
                          ),
                        }}
                      >
                        {day.solarAvailability || "UNKNOWN"} SUNLIGHT
                      </div>
                    </div>
                  ))}
                </div>

                {weatherForecast[0]?.strategy && (
                  <div
                    style={{
                      marginTop: "16px",
                      borderRadius: "14px",
                      padding: "18px",
                      background: "#eef8f6",
                      border: "1px solid #c8e5df",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        color: "#0f6e66",
                      }}
                    >
                      TODAY'S ENERGY PLAN
                    </div>

                    <div
                      style={{
                        marginTop: "7px",
                        fontSize: "18px",
                        fontWeight: 800,
                      }}
                    >
                      ⚡ {weatherForecast[0].strategy.mode}
                    </div>

                    <p
                      style={{
                        margin: "8px 0 0",
                        lineHeight: 1.55,
                      }}
                    >
                      {weatherForecast[0].solarAvailability === "HIGH"
                        ? "VOOLER will prioritize chamber cooling and use available surplus solar energy to charge the PCM thermal storage."
                        : weatherForecast[0].solarAvailability === "MODERATE"
                        ? "VOOLER will maintain chamber cooling while balancing available solar energy, battery usage, and PCM charging."
                        : "VOOLER will conserve battery energy and rely more on stored PCM cooling to reduce compressor demand where possible."}
                    </p>

                    <div
                      style={{
                        marginTop: "10px",
                        fontSize: "12px",
                        opacity: 0.65,
                      }}
                    >
                      Planning guidance is generated from the
                      storage-site weather forecast and VOOLER's
                      prototype energy-management rules.
                    </div>
                  </div>
                )}
              </>
            )}

          {!weatherLoading &&
            !weatherError &&
            weatherForecast.length === 0 && (
              <div className="alert-warning">
                ☁️ Weather forecast temporarily unavailable.
              </div>
            )}
        </section>


        {/* =================================================
            ESTIMATED COOLING BACKUP
        ================================================= */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dfe8e6",
            borderRadius: "16px",
            padding: "18px 20px",
            marginTop: "18px",
            marginBottom: "18px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <h2 style={{ margin: 0 }}>❄️ Estimated Cooling Backup</h2>

            <button
              type="button"
              aria-label="About estimated cooling backup"
              onClick={() => setShowCoolingBackupInfo(true)}
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                border: "1px solid #9aa8a5",
                background: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                padding: 0,
                color: "inherit",
              }}
            >
              ?
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "8px",
              marginTop: "12px",
            }}
          >
            <span
              style={{
                fontSize: "34px",
                fontWeight: 800,
                letterSpacing: "1px",
              }}
            >
              ----
            </span>
            <span style={{ fontSize: "18px", fontWeight: 700 }}>hrs</span>
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "14px",
              opacity: 0.7,
            }}
          >
            Estimate available when device data is received
          </div>
        </section>


        {showCoolingBackupInfo && (
          <div
            onClick={() => setShowCoolingBackupInfo(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 9999,
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cooling-backup-info-title"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "460px",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "22px",
                boxShadow: "0 18px 50px rgba(0, 0, 0, 0.2)",
                position: "relative",
              }}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowCoolingBackupInfo(false)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "14px",
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>

              <h3 id="cooling-backup-info-title" style={{ margin: "0 32px 12px 0" }}>
                Estimated Cooling Backup
              </h3>

              <p style={{ margin: "0 0 12px", lineHeight: 1.55 }}>
                Shows the estimated time your Vooler can keep the stored produce
                cool without sunlight, based on battery status, stored cooling
                capacity, and data from previous testing cycles.
              </p>

              <p style={{ margin: 0, lineHeight: 1.55, opacity: 0.75 }}>
                <strong>Note:</strong> Actual backup time may vary with
                environmental and operating conditions.
              </p>
            </div>
          </div>
        )}


        <div className="alerts-emergency-grid">

        {/* =================================================
            EMERGENCY CONTROL
        ================================================= */}

        <section

          className={
            `emergency-control-card ${
              emergencyShutdown
                ? "active"
                : ""
            }`
          }

        >

          <div className="emergency-control-info">

            <div className="emergency-control-title">

              🚨 Emergency Control

            </div>


            <p>

              {emergencyShutdown

                ? "Emergency shutdown is ACTIVE. The cooling system has been commanded to stop."

                : "Use this only when the cooling system must be stopped immediately."}

            </p>


            <div
              className={
                `emergency-status ${
                  emergencyShutdown
                    ? "shutdown"
                    : "running"
                }`
              }
            >

              {emergencyShutdown

                ? "SHUTDOWN ACTIVE"

                : "SYSTEM RUNNING"}

            </div>


            {emergencyError && (

              <div className="emergency-error">

                ⚠️ {emergencyError}

              </div>

            )}

          </div>


          <div className="emergency-control-actions">

            {!emergencyShutdown ? (

              <button

                type="button"

                className="emergency-shutdown-button"

                onClick={
                  handleEmergencyShutdown
                }

                disabled={
                  emergencyLoading
                }

              >

                {emergencyLoading

                  ? "SENDING..."

                  : "EMERGENCY SHUTDOWN"}

              </button>

            ) : (

              <button

                type="button"

                className="resume-system-button"

                onClick={
                  handleResumeSystem
                }

                disabled={
                  emergencyLoading
                }

              >

                {emergencyLoading

                  ? "SENDING..."

                  : "RESUME SYSTEM"}

              </button>

            )}

          </div>

        </section>


        {/* =================================================
            ALERTS
        ================================================= */}

        <section className="alerts-section">

          <div className="section-heading">

            <h2>
              🔔 {t.smartAlerts}
            </h2>


            <span>
              {t.liveMonitoring}
            </span>

          </div>


          {emergencyShutdown && (

            <div className="alert-danger">

              🚨 Emergency shutdown is active.

            </div>

          )}


          {overallStatus ===
            "SAFE" &&

            !chamber1Fluctuation &&

            !chamber2Fluctuation &&

            !humidityFluctuation &&

            !emergencyShutdown && (

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


          {chamber1Status ===
            "WARNING" && (

              <div className="alert-warning">

                ⚠️ Chamber 1 temperature warning:{" "}
                {chamber1Temperature}°C

              </div>

            )}


          {chamber1Status ===
            "UNSAFE" && (

              <div className="alert-danger">

                🚨 Chamber 1 unsafe temperature:{" "}
                {chamber1Temperature}°C

              </div>

            )}


          {chamber2Status ===
            "WARNING" && (

              <div className="alert-warning">

                ⚠️ Chamber 2 temperature warning:{" "}
                {chamber2Temperature}°C

              </div>

            )}


          {chamber2Status ===
            "UNSAFE" && (

              <div className="alert-danger">

                🚨 Chamber 2 unsafe temperature:{" "}
                {chamber2Temperature}°C

              </div>

            )}


          {chamber1Status ===
            "NO_DATA" && (

              <div className="alert-warning">

                🌡 Waiting for Chamber 1 temperature data.

              </div>

            )}


          {chamber2Status ===
            "NO_DATA" && (

              <div className="alert-warning">

                🌡 Waiting for Chamber 2 temperature data.

              </div>

            )}


          {humidityStatus ===
            "ATTENTION" && (

              <div className="alert-warning">

                ⚠️ Humidity needs attention:{" "}
                {humidity}%

              </div>

            )}


          {chamber1Fluctuation && (

            <div className="alert-warning">

              🌡 Chamber 1 temperature fluctuation. Change:{" "}

              {chamber1Difference.toFixed(
                1
              )}
              °C

            </div>

          )}


          {chamber2Fluctuation && (

            <div className="alert-warning">

              🌡 Chamber 2 temperature fluctuation. Change:{" "}

              {chamber2Difference.toFixed(
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

        </div>


        {/* =================================================
            SENSOR HISTORY - TABBED GRAPH
        ================================================= */}

        <section
          className="chart-card"
          style={{ marginTop: "20px", marginBottom: "20px" }}
        >
          <div className="section-heading">
            <h2>📊 Sensor History</h2>
            <span>Recent readings</span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            {[
              ["temperature", "🌡 Temperature"],
              ["humidity", "💧 Humidity"],
              ["power", "⚡ Power"],
              ["connectivity", "📡 Device"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveGraph(key)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "9px",
                  border:
                    activeGraph === key
                      ? "1px solid #148278"
                      : "1px solid #d8e2df",
                  background:
                    activeGraph === key
                      ? "#e8f5f3"
                      : "#ffffff",
                  color:
                    activeGraph === key
                      ? "#0f6e66"
                      : "#344054",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="chart-container">
            {activeGraph === "temperature" && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      value === null || value === undefined
                        ? "No data"
                        : `${value} °C`,
                      name,
                    ]}
                  />
                  <Legend
                    align="right"
                    verticalAlign="top"
                    iconType="line"
                    wrapperStyle={{ paddingBottom: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="chamber1Temperature"
                    name="Chamber 1"
                    stroke="#0f8f83"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#0f8f83" }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="chamber2Temperature"
                    name="Chamber 2"
                    stroke="#f28c28"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#f28c28" }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeGraph === "humidity" && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
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
                    name={t.humidity}
                    strokeWidth={3}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeGraph === "power" && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} />
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
                    name={t.power}
                    strokeWidth={3}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeGraph === "connectivity" && (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={connectivityHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} />
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
                    name={t.device}
                    strokeWidth={3}
                    dot={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>


        {/* =================================================
            RECENT READINGS - COLLAPSIBLE
        ================================================= */}

        <section className="history-section">
          <button
            type="button"
            onClick={() => setShowRecentReadings((current) => !current)}
            aria-expanded={showRecentReadings}
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div className="section-heading" style={{ marginBottom: showRecentReadings ? "18px" : 0 }}>
              <h2>📊 {t.recentReadings}</h2>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: 700,
                }}
              >
                {history.length} {t.recent}
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: "18px",
                    lineHeight: 1,
                    transform: showRecentReadings ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                >
                  ▼
                </span>
              </span>
            </div>
          </button>

          {showRecentReadings && (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>{t.time}</th>
                    <th>Chamber 1</th>
                    <th>Chamber 2</th>
                    <th>{t.humidity}</th>
                    <th>{t.power}</th>
                    <th>{t.device}</th>
                  </tr>
                </thead>

                <tbody>
                  {[...history]
                    .reverse()
                    .map((reading, index) => (
                      <tr key={reading.timestamp || index}>
                        <td>{reading.time}</td>

                        <td>
                          {reading.chamber1Temperature !== null
                            ? `${reading.chamber1Temperature}°C`
                            : "--"}
                        </td>

                        <td>
                          {reading.chamber2Temperature !== null
                            ? `${reading.chamber2Temperature}°C`
                            : "--"}
                        </td>

                        <td>{reading.humidity}%</td>

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
          )}
        </section>


        {/* LAST UPDATE */}

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