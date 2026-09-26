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

  const t =
    translations[language] ||
    translations.en;


  // =====================================================
  // SENSOR DATA
  // =====================================================

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
        hum < 45
      ) {

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

    humidityStatus ===
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
      "WARNING"

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
                `status-badge ${humidityStatus.toLowerCase()}`
              }
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
              </div>
            </div>

            <div className={`status-badge ${getStatusClass(chamber2Status)}`}>
              {translateStatus(chamber2Status)}
            </div>
          </div>

        </section>


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


        {/* =================================================
            GRAPHS
        ================================================= */}

        <section className="charts-section">


          {/* CHAMBER 1 */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                🌡 Chamber 1 Temperature
              </h2>


              <span>
                Recent readings
              </span>

            </div>


            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart
                  data={
                    history
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="time"
                  />


                  <YAxis />


                  <Tooltip

                    formatter={
                      (value) => [

                        value ===
                          null ||
                        value ===
                          undefined

                          ? "No data"

                          : `${value} °C`,

                        "Temperature",

                      ]
                    }

                  />


                  <Line
                    type="monotone"
                    dataKey="chamber1Temperature"
                    name="Chamber 1"
                    strokeWidth={3}
                    dot={true}
                    connectNulls={false}
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* CHAMBER 2 */}

          <div className="chart-card">

            <div className="section-heading">

              <h2>
                🌡 Chamber 2 Temperature
              </h2>


              <span>
                Recent readings
              </span>

            </div>


            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={260}
              >

                <LineChart
                  data={
                    history
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="time"
                  />


                  <YAxis />


                  <Tooltip

                    formatter={
                      (value) => [

                        value ===
                          null ||
                        value ===
                          undefined

                          ? "No data"

                          : `${value} °C`,

                        "Temperature",

                      ]
                    }

                  />


                  <Line
                    type="monotone"
                    dataKey="chamber2Temperature"
                    name="Chamber 2"
                    strokeWidth={3}
                    dot={true}
                    connectNulls={false}
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

                <LineChart
                  data={
                    history
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="time"
                  />


                  <YAxis />


                  <Tooltip

                    formatter={
                      (value) => [

                        `${value}%`,

                        t.humidity,

                      ]
                    }

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

                <LineChart
                  data={
                    history
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="time"
                  />


                  <YAxis
                    domain={[
                      0,
                      1,
                    ]}
                    ticks={[
                      0,
                      1,
                    ]}
                  />


                  <Tooltip

                    formatter={
                      (value) => [

                        value === 1

                          ? t.powerAvailable

                          : t.powerFailure,

                        t.power,

                      ]
                    }

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
                    domain={[
                      0,
                      1,
                    ]}
                    ticks={[
                      0,
                      1,
                    ]}
                  />


                  <Tooltip

                    formatter={
                      (value) => [

                        value === 1

                          ? t.deviceOnline

                          : t.deviceOffline,

                        t.device,

                      ]
                    }

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


        {/* =================================================
            RECENT READINGS
        ================================================= */}

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
                    Chamber 1
                  </th>

                  <th>
                    Chamber 2
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
                    (
                      reading,
                      index
                    ) => (

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

                          {reading
                            .chamber1Temperature !==
                          null

                            ? `${reading.chamber1Temperature}°C`

                            : "--"}

                        </td>


                        <td>

                          {reading
                            .chamber2Temperature !==
                          null

                            ? `${reading.chamber2Temperature}°C`

                            : "--"}

                        </td>


                        <td>

                          {reading.humidity}%

                        </td>


                        <td>

                          {reading.power ===
                          1

                            ? t.on

                            : t.failure}

                        </td>


                        <td>

                          {reading.online ===
                          1

                            ? t.online

                            : t.offline}

                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>

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