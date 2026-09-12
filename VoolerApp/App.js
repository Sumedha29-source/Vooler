import { useEffect, useState } from "react";

import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";

const API_BASE_URL =
  "https://vooler.onrender.com";

export default function App() {
  // ========================================
  // GENERAL APP STATE
  // ========================================

  const [showLogin, setShowLogin] =
    useState(false);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [farmer, setFarmer] =
    useState(null);


  // ========================================
  // DASHBOARD STATE
  // ========================================

  const [temperature, setTemperature] =
    useState(0);

  const [humidity, setHumidity] =
    useState(0);

  const [power, setPower] =
    useState(false);

  const [online, setOnline] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState("");

  const [history, setHistory] =
    useState([]);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  const [dashboardError, setDashboardError] =
    useState("");


  // ========================================
  // LOGIN
  // ========================================

  const handleLogin = async () => {
    if (!name.trim()) {
      Alert.alert(
        "Missing Name",
        "Please enter your farmer name."
      );

      return;
    }

    if (!phone.trim()) {
      Alert.alert(
        "Missing Phone Number",
        "Please enter your mobile number."
      );

      return;
    }

    if (phone.trim().length !== 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a 10 digit mobile number."
      );

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Login response:",
        data
      );

      if (!response.ok) {
        Alert.alert(
          "Login Failed",
          data.message ||
            "Invalid farmer details."
        );

        return;
      }

      setFarmer(
        data.farmer
      );

      setLoggedIn(
        true
      );

    } catch (error) {
      console.log(
        "Login error:",
        error
      );

      Alert.alert(
        "Connection Error",
        "Unable to connect to VOOLER server."
      );

    } finally {
      setLoading(false);
    }
  };


  // ========================================
  // FETCH DASHBOARD DATA
  // ========================================

  const fetchDashboardData = async () => {
    if (!farmer?.storageId) {
      return;
    }

    try {
      setDashboardLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/${farmer.storageId}`
      );

      const data =
        await response.json();

      console.log(
        "Dashboard response:",
        data
      );

      if (!response.ok) {
        setDashboardError(
          data.message ||
            "Unable to load dashboard."
        );

        return;
      }

      // ----------------------------------------
      // LATEST READING
      // ----------------------------------------

      if (data.latest) {
        setTemperature(
          data.latest.temperature
        );

        setHumidity(
          data.latest.humidity
        );

        setPower(
          data.latest.power
        );

        setOnline(
          data.latest.online
        );

        const date =
          new Date(
            data.latest.timestamp
          );

        setLastUpdated(
          date.toLocaleTimeString()
        );
      } else {
        setOnline(false);
      }


      // ----------------------------------------
      // HISTORY
      // ----------------------------------------

      setHistory(
        data.history || []
      );


      setDashboardError("");

    } catch (error) {
      console.log(
        "Dashboard error:",
        error
      );

      setDashboardError(
        "Unable to receive storage data."
      );

      setOnline(false);

    } finally {
      setDashboardLoading(false);
    }
  };


  // ========================================
  // AUTO REFRESH EVERY 10 SECONDS
  // ========================================

  useEffect(() => {
    if (
      !loggedIn ||
      !farmer?.storageId
    ) {
      return;
    }

    fetchDashboardData();

    const interval =
      setInterval(
        fetchDashboardData,
        10000
      );

    return () =>
      clearInterval(interval);

  }, [
    loggedIn,
    farmer?.storageId,
  ]);


  // ========================================
  // STATUS LOGIC
  // ========================================

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


  const temperatureStatus =
    getTempStatus(temperature);

  const humidityStatus =
    getHumidityStatus(humidity);


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


  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    setLoggedIn(false);
    setFarmer(null);

    setShowLogin(false);

    setName("");
    setPhone("");

    setTemperature(0);
    setHumidity(0);
    setPower(false);
    setOnline(false);

    setHistory([]);

    setLastUpdated("");
    setDashboardError("");
  };


  // ========================================
  // DASHBOARD
  // ========================================

  if (loggedIn) {
    return (
      <ScrollView
        style={styles.dashboardPage}
        contentContainerStyle={
          styles.dashboardContent
        }
      >
        {/* HEADER */}

        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.dashboardLogo}>
              ❄ VOOLER
            </Text>

            <Text style={styles.welcomeText}>
              Welcome,{" "}
              {farmer?.name || name}
            </Text>

            <Text style={styles.storageText}>
              Storage ID:{" "}
              {farmer?.storageId}
            </Text>
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </Pressable>
        </View>


        {/* LOADING */}

        {dashboardLoading &&
          !lastUpdated && (
            <View style={styles.loadingBox}>
              <ActivityIndicator
                size="large"
              />

              <Text style={styles.loadingText}>
                Loading storage data...
              </Text>
            </View>
          )}


        {/* ERROR */}

        {dashboardError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              📡 {dashboardError}
            </Text>
          </View>
        ) : null}


        {/* STORAGE CONDITION */}

        <View
          style={[
            styles.statusCard,

            overallStatus === "SAFE" &&
              styles.statusSafe,

            overallStatus === "ATTENTION" &&
              styles.statusAttention,

            overallStatus === "UNSAFE" &&
              styles.statusUnsafe,
          ]}
        >
          <Text style={styles.statusLabel}>
            STORAGE CONDITION
          </Text>

          <Text style={styles.statusMain}>
            {overallStatus === "SAFE"
              ? "🟢 SAFE"
              : overallStatus === "ATTENTION"
              ? "🟡 ATTENTION"
              : "🔴 UNSAFE"}
          </Text>

          <Text style={styles.statusDescription}>
            {overallStatus === "SAFE"
              ? "Storage conditions are within the safe operating range."
              : overallStatus === "ATTENTION"
              ? "Some storage parameters require attention."
              : "Unsafe storage condition detected. Immediate attention required."}
          </Text>
        </View>


        {/* TEMPERATURE */}

        <View style={styles.sensorCard}>
          <Text style={styles.sensorIcon}>
            🌡
          </Text>

          <Text style={styles.sensorTitle}>
            Temperature
          </Text>

          <Text style={styles.sensorValue}>
            {temperature}°C
          </Text>

          <View
            style={[
              styles.badge,

              temperatureStatus === "SAFE" &&
                styles.badgeSafe,

              temperatureStatus === "WARNING" &&
                styles.badgeWarning,

              temperatureStatus === "UNSAFE" &&
                styles.badgeUnsafe,
            ]}
          >
            <Text style={styles.badgeText}>
              {temperatureStatus}
            </Text>
          </View>
        </View>


        {/* HUMIDITY */}

        <View style={styles.sensorCard}>
          <Text style={styles.sensorIcon}>
            💧
          </Text>

          <Text style={styles.sensorTitle}>
            Humidity
          </Text>

          <Text style={styles.sensorValue}>
            {humidity}%
          </Text>

          <View
            style={[
              styles.badge,

              humidityStatus === "SAFE" &&
                styles.badgeSafe,

              humidityStatus === "WARNING" &&
                styles.badgeWarning,

              humidityStatus === "UNSAFE" &&
                styles.badgeUnsafe,
            ]}
          >
            <Text style={styles.badgeText}>
              {humidityStatus}
            </Text>
          </View>
        </View>


        {/* POWER */}

        <View style={styles.sensorCard}>
          <Text style={styles.sensorIcon}>
            ⚡
          </Text>

          <Text style={styles.sensorTitle}>
            Power Supply
          </Text>

          <Text style={styles.sensorValue}>
            {power
              ? "ON"
              : "FAILURE"}
          </Text>

          <View
            style={[
              styles.badge,
              power
                ? styles.badgeSafe
                : styles.badgeUnsafe,
            ]}
          >
            <Text style={styles.badgeText}>
              {power
                ? "AVAILABLE"
                : "FAILURE"}
            </Text>
          </View>
        </View>


        {/* DEVICE */}

        <View style={styles.sensorCard}>
          <Text style={styles.sensorIcon}>
            📡
          </Text>

          <Text style={styles.sensorTitle}>
            Device Status
          </Text>

          <Text style={styles.sensorValue}>
            {online
              ? "ONLINE"
              : "OFFLINE"}
          </Text>

          <View
            style={[
              styles.badge,
              online
                ? styles.badgeSafe
                : styles.badgeUnsafe,
            ]}
          >
            <Text style={styles.badgeText}>
              {online
                ? "CONNECTED"
                : "NO DATA"}
            </Text>
          </View>
        </View>


        {/* LAST UPDATE */}

        <View style={styles.lastUpdateCard}>
          <Text style={styles.lastUpdateText}>
            📡 Last data received:
          </Text>

          <Text style={styles.lastUpdateTime}>
            {lastUpdated ||
              "Waiting for data..."}
          </Text>
        </View>


        {/* RECENT READINGS */}

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>
            Recent Readings
          </Text>

          {history.length === 0 ? (
            <Text style={styles.noHistoryText}>
              No readings available.
            </Text>
          ) : (
            history
              .slice(-10)
              .reverse()
              .map(
                (
                  reading,
                  index
                ) => {
                  const time =
                    new Date(
                      reading.timestamp
                    ).toLocaleTimeString();

                  return (
                    <View
                      key={
                        reading.timestamp ||
                        index
                      }
                      style={
                        styles.historyRow
                      }
                    >
                      <Text
                        style={
                          styles.historyTime
                        }
                      >
                        {time}
                      </Text>

                      <View
                        style={
                          styles.historyValuesRow
                        }
                      >
                        <Text
                          style={
                            styles.historyValue
                          }
                        >
                          🌡{" "}
                          {
                            reading.temperature
                          }
                          °C
                        </Text>

                        <Text
                          style={
                            styles.historyValue
                          }
                        >
                          💧{" "}
                          {
                            reading.humidity
                          }
                          %
                        </Text>
                      </View>
                    </View>
                  );
                }
              )
          )}
        </View>


        {/* REFRESH */}

        <Pressable
          style={styles.refreshButton}
          onPress={fetchDashboardData}
        >
          <Text style={styles.refreshText}>
            ↻ Refresh Data
          </Text>
        </Pressable>

      </ScrollView>
    );
  }


  // ========================================
  // LOGIN SCREEN
  // ========================================

  if (showLogin) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>
          ❄ VOOLER
        </Text>

        <Text style={styles.subtitle}>
          Farmer Login
        </Text>

        <View style={styles.card}>
          <Text style={styles.title}>
            Login to your storage
          </Text>

          <Text style={styles.label}>
            Farmer Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>
            Mobile Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter 10 digit mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Pressable
            style={[
              styles.button,
              loading &&
                styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Logging in..."
                : "Login"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setShowLogin(false)
            }
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }


  // ========================================
  // HOME SCREEN
  // ========================================

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>
        ❄ VOOLER
      </Text>

      <Text style={styles.subtitle}>
        Smart Cold Storage Monitoring
      </Text>

      <View style={styles.card}>
        <Text style={styles.title}>
          Welcome to VOOLER
        </Text>

        <Text style={styles.description}>
          Monitor temperature,
          humidity, storage condition
          and device status directly
          from your phone.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() =>
            setShowLogin(true)
          }
        >
          <Text style={styles.buttonText}>
            Farmer Login
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


// ========================================
// STYLES
// ========================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f3f6f8",
      justifyContent: "center",
      padding: 24,
    },

    logo: {
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
    },

    subtitle: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: 30,
    },

    card: {
      backgroundColor: "#ffffff",
      padding: 24,
      borderRadius: 20,
      elevation: 5,
    },

    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 18,
    },

    description: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 24,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
    },

    input: {
      borderWidth: 1,
      borderColor: "#d1d5db",
      borderRadius: 12,
      padding: 14,
      marginBottom: 16,
      fontSize: 16,
      backgroundColor: "#ffffff",
    },

    button: {
      backgroundColor: "#111827",
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 8,
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },

    backText: {
      textAlign: "center",
      marginTop: 20,
      fontSize: 16,
      color: "#374151",
    },


    // ========================================
    // DASHBOARD
    // ========================================

    dashboardPage: {
      flex: 1,
      backgroundColor: "#f3f6f8",
    },

    dashboardContent: {
      padding: 20,
      paddingTop: 50,
      paddingBottom: 50,
    },

    dashboardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 24,
    },

    dashboardLogo: {
      fontSize: 28,
      fontWeight: "bold",
    },

    welcomeText: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 8,
    },

    storageText: {
      fontSize: 14,
      marginTop: 4,
      color: "#4b5563",
    },

    logoutButton: {
      backgroundColor: "#111827",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
    },

    logoutText: {
      color: "#ffffff",
      fontWeight: "600",
    },

    loadingBox: {
      alignItems: "center",
      marginVertical: 20,
    },

    loadingText: {
      marginTop: 10,
    },

    errorBox: {
      backgroundColor: "#fee2e2",
      padding: 14,
      borderRadius: 12,
      marginBottom: 16,
    },

    errorText: {
      color: "#991b1b",
      fontWeight: "600",
    },

    statusCard: {
      padding: 22,
      borderRadius: 18,
      marginBottom: 18,
      borderWidth: 1,
    },

    statusSafe: {
      backgroundColor: "#ecfdf5",
      borderColor: "#10b981",
    },

    statusAttention: {
      backgroundColor: "#fffbeb",
      borderColor: "#f59e0b",
    },

    statusUnsafe: {
      backgroundColor: "#fef2f2",
      borderColor: "#ef4444",
    },

    statusLabel: {
      fontSize: 12,
      letterSpacing: 1.5,
      color: "#6b7280",
      textAlign: "center",
    },

    statusMain: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 10,
    },

    statusDescription: {
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
      color: "#4b5563",
    },

    sensorCard: {
      backgroundColor: "#ffffff",
      padding: 20,
      borderRadius: 18,
      marginBottom: 14,
      elevation: 3,
    },

    sensorIcon: {
      fontSize: 28,
      marginBottom: 8,
    },

    sensorTitle: {
      fontSize: 16,
      color: "#4b5563",
    },

    sensorValue: {
      fontSize: 30,
      fontWeight: "bold",
      marginVertical: 10,
    },

    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },

    badgeSafe: {
      backgroundColor: "#d1fae5",
    },

    badgeWarning: {
      backgroundColor: "#fef3c7",
    },

    badgeUnsafe: {
      backgroundColor: "#fee2e2",
    },

    badgeText: {
      fontWeight: "700",
      fontSize: 12,
    },

    lastUpdateCard: {
      backgroundColor: "#ffffff",
      padding: 18,
      borderRadius: 16,
      marginTop: 4,
    },

    lastUpdateText: {
      fontSize: 14,
      color: "#4b5563",
    },

    lastUpdateTime: {
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 6,
    },


    // ========================================
    // HISTORY
    // ========================================

    historyCard: {
      backgroundColor: "#ffffff",
      padding: 18,
      borderRadius: 16,
      marginTop: 16,
    },

    historyTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 14,
    },

    historyRow: {
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingVertical: 12,
    },

    historyTime: {
      fontSize: 12,
      color: "#6b7280",
      marginBottom: 6,
    },

    historyValuesRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },

    historyValue: {
      fontSize: 15,
      fontWeight: "500",
    },

    noHistoryText: {
      fontSize: 14,
      color: "#6b7280",
    },


    // ========================================
    // REFRESH
    // ========================================

    refreshButton: {
      backgroundColor: "#111827",
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 18,
    },

    refreshText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "600",
    },
  });