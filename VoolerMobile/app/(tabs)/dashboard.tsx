import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

import {
  LineChart,
} from "react-native-chart-kit";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Text,
} from "@/components/ui/text";


const API_BASE_URL =
  "https://vooler.onrender.com";


const SCREEN_WIDTH =
  Dimensions.get("window").width;

const CHART_WIDTH =
  Math.max(
    SCREEN_WIDTH - 72,
    280
  );


type Farmer = {
  id?: string;
  _id?: string;
  name?: string;
  phone?: string;
  storageId?: string;
  simNumber?: string;
  language?: string;
};


type Reading = {
  _id?: string;

  chamber1Temperature?: number;
  chamber2Temperature?: number;

  chamber1SetTemperature?: number;
  chamber2SetTemperature?: number;

  humidity?: number;

  power?: boolean;
  online?: boolean;

  timestamp?: string;
  createdAt?: string;
  time?: string;
};


type WeatherDay = {
  date?: string;

  condition?: string;

  temperature?: {
    max?: number;
    min?: number;
  };

  precipitationProbability?: number;
  cloudCover?: number;
  sunshineHours?: number;
  solarRadiation?: number;

  solarAvailability?: string;

  strategy?: {
    mode?: string;
  };
};


type HistoryGraph =
  | "temperature"
  | "humidity"
  | "power"
  | "connectivity";


const getReadingTime =
  (reading: Reading) => {

    return (
      reading.createdAt ||
      reading.timestamp ||
      reading.time ||
      ""
    );
  };


const formatChartTime =
  (reading: Reading) => {

    const raw =
      getReadingTime(reading);

    if (!raw) {
      return "";
    }

    return new Date(
      raw
    ).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };


const createLabels =
  (
    readings: Reading[]
  ) => {

    if (
      readings.length <= 6
    ) {
      return readings.map(
        formatChartTime
      );
    }

    return readings.map(
      (
        reading,
        index
      ) => {

        const lastIndex =
          readings.length - 1;

        if (
          index === 0 ||
          index === lastIndex ||
          index %
            Math.ceil(
              readings.length / 4
            ) ===
            0
        ) {

          return formatChartTime(
            reading
          );
        }

        return "";
      }
    );
  };


const chartConfig = {

  backgroundGradientFrom:
    "#ffffff",

  backgroundGradientTo:
    "#ffffff",

  decimalPlaces: 1,

  color:
    (opacity = 1) =>
      `rgba(20, 130, 120, ${opacity})`,

  labelColor:
    (opacity = 1) =>
      `rgba(71, 85, 105, ${opacity})`,

  propsForBackgroundLines: {
    strokeDasharray:
      "4 4",
  },

  propsForDots: {
    r: "3",
  },

};


const getForecastDayLabel =
  (
    dateString?: string,
    index?: number
  ) => {

    if (index === 0) {
      return "Today";
    }

    if (index === 1) {
      return "Tomorrow";
    }

    if (!dateString) {
      return `Day ${(index ?? 0) + 1}`;
    }

    const date =
      new Date(
        `${dateString}T12:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return `Day ${(index ?? 0) + 1}`;
    }

    return date.toLocaleDateString(
      [],
      {
        weekday: "short",
      }
    );
  };


const getWeatherIcon =
  (condition?: string) => {

    const value =
      (
        condition || ""
      ).toLowerCase();

    if (
      value.includes("thunder")
    ) {
      return "⛈️";
    }

    if (
      value.includes("rain") ||
      value.includes("drizzle") ||
      value.includes("shower")
    ) {
      return "🌧️";
    }

    if (
      value.includes("cloud") ||
      value.includes("overcast")
    ) {
      return "☁️";
    }

    if (
      value.includes("fog") ||
      value.includes("mist")
    ) {
      return "🌫️";
    }

    if (
      value.includes("clear") ||
      value.includes("sun")
    ) {
      return "☀️";
    }

    return "🌤️";
  };


const getSolarBadgeClass =
  (availability?: string) => {

    if (
      availability === "HIGH"
    ) {

      return (
        "bg-emerald-100 " +
        "border-emerald-300"
      );
    }

    if (
      availability ===
      "MODERATE"
    ) {

      return (
        "bg-amber-100 " +
        "border-amber-300"
      );
    }

    return (
      "bg-red-100 " +
      "border-red-300"
    );
  };


const getSolarTextClass =
  (availability?: string) => {

    if (
      availability === "HIGH"
    ) {
      return "text-emerald-700";
    }

    if (
      availability ===
      "MODERATE"
    ) {
      return "text-amber-700";
    }

    return "text-red-700";
  };


export default function DashboardScreen() {

  const [
    farmer,
    setFarmer,
  ] =
    useState<Farmer | null>(
      null
    );


  const [
    chamber1Temperature,
    setChamber1Temperature,
  ] =
    useState<number | null>(
      null
    );


  const [
    chamber2Temperature,
    setChamber2Temperature,
  ] =
    useState<number | null>(
      null
    );


  const [
    chamber1SetTemperature,
    setChamber1SetTemperature,
  ] =
    useState<number | null>(
      null
    );


  const [
    chamber2SetTemperature,
    setChamber2SetTemperature,
  ] =
    useState<number | null>(
      null
    );


  const [
    humidity,
    setHumidity,
  ] =
    useState<number | null>(
      null
    );


  const [
    power,
    setPower,
  ] =
    useState(false);


  const [
    online,
    setOnline,
  ] =
    useState(false);


  const [
    history,
    setHistory,
  ] =
    useState<Reading[]>([]);


  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState("");


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    selectedHistoryGraph,
    setSelectedHistoryGraph,
  ] =
    useState<HistoryGraph>(
      "temperature"
    );


  // ===================================================
  // EMERGENCY CONTROL
  // ===================================================

  const [
    emergencyShutdown,
    setEmergencyShutdown,
  ] =
    useState(false);


  const [
    emergencyLoading,
    setEmergencyLoading,
  ] =
    useState(false);


  const [
    emergencyError,
    setEmergencyError,
  ] =
    useState("");


  // ===================================================
  // DOOR ACCESS PIN
  // ===================================================

  const [
    devicePin,
    setDevicePin,
  ] =
    useState<string | null>(
      null
    );


  const [
    showDevicePin,
    setShowDevicePin,
  ] =
    useState(false);


  const [
    pinLoading,
    setPinLoading,
  ] =
    useState(false);


  const [
    pinError,
    setPinError,
  ] =
    useState("");


  // ===================================================
  // WEATHER
  // ===================================================

  const [
    weatherForecast,
    setWeatherForecast,
  ] =
    useState<WeatherDay[]>([]);


  const [
    weatherLocation,
    setWeatherLocation,
  ] =
    useState("");


  const [
    weatherLoading,
    setWeatherLoading,
  ] =
    useState(false);


  const [
    weatherError,
    setWeatherError,
  ] =
    useState("");


  // ===================================================
  // LOAD FARMER
  // ===================================================

  useEffect(() => {

    const loadFarmer =
      async () => {

        try {

          const stored =
            await AsyncStorage.getItem(
              "voolerFarmer"
            );

          if (!stored) {

            setError(
              "No farmer login found."
            );

            return;
          }

          const parsed:
            Farmer =
            JSON.parse(
              stored
            );

          setFarmer(
            parsed
          );

        }
        catch (err) {

          console.log(
            "FARMER LOAD ERROR:",
            err
          );

          setError(
            "Unable to load farmer information."
          );
        }

      };

    loadFarmer();

  }, []);


  // ===================================================
  // FETCH DASHBOARD
  // ===================================================

  const fetchDashboard =
    useCallback(
      async () => {

        if (
          !farmer?.storageId
        ) {
          return;
        }

        try {

          setLoading(true);

          const response =
            await fetch(
              `${API_BASE_URL}/api/dashboard/${farmer.storageId}`
            );

          const data =
            await response.json();

          if (!response.ok) {

            throw new Error(
              data.message ||
              "Unable to load dashboard."
            );
          }


          const latest =
            data.latest;


          if (!latest) {

            setError(
              "No sensor data available."
            );

            return;
          }


          setChamber1Temperature(

            typeof latest
              .chamber1Temperature ===
            "number"

              ? latest
                  .chamber1Temperature

              : null

          );


          setChamber2Temperature(

            typeof latest
              .chamber2Temperature ===
            "number"

              ? latest
                  .chamber2Temperature

              : null

          );


          setChamber1SetTemperature(

            typeof latest
              .chamber1SetTemperature ===
            "number"

              ? latest
                  .chamber1SetTemperature

              : null

          );


          setChamber2SetTemperature(

            typeof latest
              .chamber2SetTemperature ===
            "number"

              ? latest
                  .chamber2SetTemperature

              : null

          );


          setHumidity(

            typeof latest.humidity ===
            "number"

              ? latest.humidity

              : null

          );


          setPower(
            latest.power ===
            true
          );


          setOnline(
            latest.online ===
            true
          );


          setHistory(

            Array.isArray(
              data.history
            )

              ? data.history

              : []

          );


          const rawTime =
            latest.createdAt ||
            latest.timestamp ||
            latest.time;


          if (rawTime) {

            setLastUpdated(

              new Date(
                rawTime
              ).toLocaleString()

            );
          }


          setError("");

        }
        catch (err: any) {

          console.log(
            "DASHBOARD ERROR:",
            err
          );

          setError(
            err?.message ||
            "Unable to connect to VOOLER server."
          );

        }
        finally {

          setLoading(
            false
          );
        }

      },

      [
        farmer?.storageId,
      ]

    );


  useEffect(() => {

    if (
      !farmer?.storageId
    ) {
      return;
    }

    fetchDashboard();

    const interval =
      setInterval(
        fetchDashboard,
        10000
      );

    return () =>
      clearInterval(
        interval
      );

  }, [
    farmer?.storageId,
    fetchDashboard,
  ]);


  // ===================================================
  // WEATHER
  // ===================================================

  const fetchWeatherForecast =
    useCallback(
      async () => {

        if (
          !farmer?.storageId
        ) {
          return;
        }

        try {

          setWeatherLoading(
            true
          );


          const response =
            await fetch(
              `${API_BASE_URL}/api/weather/${farmer.storageId}`
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.message ||
              "Weather forecast temporarily unavailable."
            );
          }


          setWeatherForecast(

            Array.isArray(
              data.forecast
            )

              ? data.forecast

              : []

          );


          setWeatherLocation(

            data.location
              ?.placeName ||
            farmer.storageId

          );


          setWeatherError("");

        }
        catch (err) {

          console.log(
            "WEATHER ERROR:",
            err
          );

          setWeatherForecast(
            []
          );

          setWeatherError(
            "Weather forecast temporarily unavailable."
          );

        }
        finally {

          setWeatherLoading(
            false
          );
        }

      },

      [
        farmer?.storageId,
      ]

    );


  useEffect(() => {

    if (
      !farmer?.storageId
    ) {
      return;
    }

    fetchWeatherForecast();

    const interval =
      setInterval(
        fetchWeatherForecast,
        30 * 60 * 1000
      );

    return () =>
      clearInterval(
        interval
      );

  }, [
    farmer?.storageId,
    fetchWeatherForecast,
  ]);


  // ===================================================
  // EMERGENCY STATUS
  // ===================================================

  useEffect(() => {

    if (
      !farmer?.storageId
    ) {
      return;
    }


    const fetchEmergency =
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
              "Emergency status unavailable."
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

          console.log(
            "EMERGENCY ERROR:",
            err
          );


          setEmergencyError(
            "Unable to load emergency status."
          );
        }

      };


    fetchEmergency();


    const interval =
      setInterval(
        fetchEmergency,
        5000
      );


    return () =>
      clearInterval(
        interval
      );

  }, [
    farmer?.storageId,
  ]);


  // ===================================================
  // EMERGENCY SHUTDOWN
  // ===================================================

  const sendEmergencyShutdown =
    async () => {

      if (
        !farmer?.phone ||
        !farmer?.storageId
      ) {
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
            "Unable to activate shutdown."
          );
        }


        setEmergencyShutdown(
          true
        );

      }
      catch (err: any) {

        setEmergencyError(
          err?.message ||
          "Unable to activate shutdown."
        );

      }
      finally {

        setEmergencyLoading(
          false
        );
      }

    };


  const handleEmergencyShutdown =
    () => {

      Alert.alert(
        "Emergency Shutdown",

        "This will stop the cooling system immediately.",

        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Shutdown",

            style:
              "destructive",

            onPress:
              sendEmergencyShutdown,
          },
        ]
      );

    };


  // ===================================================
  // RESUME
  // ===================================================

  const sendResumeSystem =
    async () => {

      if (
        !farmer?.phone ||
        !farmer?.storageId
      ) {
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
            "Unable to resume system."
          );
        }


        setEmergencyShutdown(
          false
        );

      }
      catch (err: any) {

        setEmergencyError(
          err?.message ||
          "Unable to resume system."
        );

      }
      finally {

        setEmergencyLoading(
          false
        );
      }

    };


  const handleResumeSystem =
    () => {

      Alert.alert(
        "Resume System",

        "Resume VOOLER cooling?",

        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Resume",

            onPress:
              sendResumeSystem,
          },
        ]
      );

    };


  // ===================================================
  // PIN
  // ===================================================

  const handleToggleDevicePin =
    async () => {

      if (showDevicePin) {

        setShowDevicePin(
          false
        );

        return;
      }


      if (devicePin) {

        setShowDevicePin(
          true
        );

        return;
      }


      const farmerId =
        farmer?.id ||
        farmer?._id;


      if (
        !farmerId ||
        !farmer?.phone
      ) {

        setPinError(
          "Unable to verify farmer information. Please log out and log in again."
        );

        return;
      }


      try {

        setPinLoading(
          true
        );


        setPinError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/device-pin`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  farmerId:
                    farmerId,

                  phone:
                    farmer.phone,
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Unable to load device PIN."
          );
        }


        const receivedPin =
          String(
            data.devicePin ?? ""
          );


        if (
          !/^\d{4}$/.test(
            receivedPin
          )
        ) {

          throw new Error(
            "A valid 4-digit door PIN has not been assigned."
          );
        }


        setDevicePin(
          receivedPin
        );


        setShowDevicePin(
          true
        );

      }
      catch (err: any) {

        console.log(
          "DEVICE PIN ERROR:",
          err
        );


        setDevicePin(
          null
        );


        setShowDevicePin(
          false
        );


        setPinError(
          err?.message ||
          "Unable to load device PIN."
        );

      }
      finally {

        setPinLoading(
          false
        );
      }

    };


  // ===================================================
  // STATUS
  // ===================================================

  const getTemperatureStatus =
    (
      value:
        number | null
    ) => {

      if (
        value === null
      ) {
        return "NO DATA";
      }

      if (
        value < 23
      ) {
        return "SAFE";
      }

      if (
        value <= 30
      ) {
        return "WARNING";
      }

      return "UNSAFE";
    };


  const getHumidityStatus =
    (
      value:
        number | null
    ) => {

      if (
        value === null
      ) {
        return "NO DATA";
      }

      if (
        value < 45
      ) {
        return "UNSAFE";
      }

      if (
        value >= 50 &&
        value <= 65
      ) {
        return "SAFE";
      }

      return "WARNING";
    };


  const chamber1Status =
    getTemperatureStatus(
      chamber1Temperature
    );


  const chamber2Status =
    getTemperatureStatus(
      chamber2Temperature
    );


  const humidityStatus =
    getHumidityStatus(
      humidity
    );


  let overallStatus =
    "SAFE";


  if (
    chamber1Status ===
      "UNSAFE" ||

    chamber2Status ===
      "UNSAFE" ||

    humidityStatus ===
      "UNSAFE" ||

    !power ||

    !online
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
      "NO DATA" ||

    chamber2Status ===
      "NO DATA" ||

    humidityStatus ===
      "WARNING"
  ) {

    overallStatus =
      "ATTENTION";

  }


  const getStatusColors =
    (
      status: string
    ) => {

      if (
        status ===
        "SAFE"
      ) {

        return {
          card:
            "bg-emerald-50 border-emerald-200",

          text:
            "text-emerald-700",
        };
      }


      if (
        status ===
          "WARNING" ||
        status ===
          "ATTENTION"
      ) {

        return {
          card:
            "bg-amber-50 border-amber-200",

          text:
            "text-amber-700",
        };
      }


      if (
        status ===
        "UNSAFE"
      ) {

        return {
          card:
            "bg-red-50 border-red-300",

          text:
            "text-red-700",
        };
      }


      return {
        card:
          "bg-slate-50 border-slate-200",

        text:
          "text-slate-600",
      };
    };


  // ===================================================
  // HISTORY DATA
  // ===================================================

  /*
   * For the combined chamber chart, both temperatures
   * must come from the SAME reading so that Chamber 1
   * and Chamber 2 share exactly the same time axis.
   */
  const temperatureHistory =
    useMemo(
      () =>
        history.filter(
          (reading) =>
            typeof reading
              .chamber1Temperature ===
              "number" &&
            typeof reading
              .chamber2Temperature ===
              "number"
        ),

      [history]
    );


  const humidityHistory =
    useMemo(
      () =>
        history.filter(
          (reading) =>
            typeof reading
              .humidity ===
            "number"
        ),

      [history]
    );


  const powerHistory =
    useMemo(
      () =>
        history.filter(
          (reading) =>
            typeof reading
              .power ===
            "boolean"
        ),

      [history]
    );


  const connectivityHistory =
    useMemo(
      () =>
        history.filter(
          (reading) =>
            typeof reading
              .online ===
            "boolean"
        ),

      [history]
    );


  // ===================================================
  // UI
  // ===================================================

  return (

    <ScrollView
      className="
        flex-1
        bg-slate-50
      "

      contentContainerClassName="
        px-5
        pt-12
        pb-28
      "

      refreshControl={

        <RefreshControl
          refreshing={
            loading
          }

          onRefresh={() => {
            fetchDashboard();
            fetchWeatherForecast();
          }}
        />

      }
    >


      {/* =================================================
          HEADER
      ================================================= */}

      <View
        className="
          rounded-3xl
          bg-teal-700
          px-6
          py-7
          mb-5
        "
      >

        <Text
          className="
            text-white
            text-4xl
            font-bold
          "
        >
          ❄ VOOLER
        </Text>


        <Text
          className="
            text-teal-100
            mt-2
          "
        >
          Smart Cold Storage Monitoring
        </Text>


        <View
          className="
            mt-5
            rounded-2xl
            bg-white/10
            px-4
            py-3
          "
        >

          <Text
            className="
              text-white
              text-lg
              font-semibold
            "
          >
            Welcome,{" "}
            {farmer?.name ||
              "Farmer"}
          </Text>


          <Text
            className="
              text-teal-100
              mt-1
            "
          >
            Storage ID:{" "}
            {farmer?.storageId ||
              "--"}
          </Text>

        </View>

      </View>


      {/* =================================================
          DOOR PIN
      ================================================= */}

      <Card
        className="
          mb-4
          bg-teal-50
          border-teal-200
        "
      >

        <CardHeader>

          <CardDescription>
            🔐 DOOR ACCESS PIN
          </CardDescription>


          <CardTitle
            className="
              text-4xl
              font-bold
              text-teal-800
              tracking-widest
              mt-2
            "
          >

            {showDevicePin &&
            devicePin

              ? devicePin

              : "••••"}

          </CardTitle>

        </CardHeader>


        <CardContent>

          <Text
            className="
              text-slate-600
              mb-3
            "
          >
            Use this 4-digit PIN on the VOOLER door keypad.
          </Text>


          <Pressable
            onPress={
              handleToggleDevicePin
            }

            disabled={
              pinLoading
            }

            className="
              rounded-xl
              border
              border-teal-300
              bg-white
              px-4
              py-3
            "
          >

            <Text
              className="
                text-center
                font-bold
                text-teal-700
              "
            >

              {pinLoading

                ? "Loading PIN..."

                : showDevicePin

                  ? "🙈 Hide PIN"

                  : "👁 Show PIN"}

            </Text>

          </Pressable>


          {pinError ? (

            <Text
              className="
                text-red-700
                font-semibold
                mt-3
              "
            >
              ⚠ {pinError}
            </Text>

          ) : null}

        </CardContent>

      </Card>


      {/* ERROR */}

      {error ? (

        <Card
          className="
            mb-4
            bg-red-50
            border-red-300
          "
        >

          <CardContent
            className="pt-5"
          >

            <Text
              className="
                text-red-700
                font-semibold
              "
            >
              ⚠ {error}
            </Text>

          </CardContent>

        </Card>

      ) : null}


      {/* =================================================
          STORAGE CONDITION
      ================================================= */}

      <Card
        className={`
          mb-4
          ${
            getStatusColors(
              overallStatus
            ).card
          }
        `}
      >

        <CardHeader>

          <CardDescription>
            STORAGE CONDITION
          </CardDescription>


          <CardTitle
            className={`
              text-3xl
              ${
                getStatusColors(
                  overallStatus
                ).text
              }
            `}
          >

            {overallStatus ===
            "SAFE"

              ? "🟢 SAFE"

              : overallStatus ===
                  "ATTENTION"

                ? "🟡 ATTENTION"

                : "🔴 UNSAFE"}

          </CardTitle>

        </CardHeader>


        <CardContent>

          <Text
            className="
              text-slate-600
            "
          >

            {overallStatus ===
            "SAFE"

              ? "Storage conditions are within the safe range."

              : overallStatus ===
                  "ATTENTION"

                ? "Some storage parameters need attention."

                : "Storage conditions require immediate attention."}

          </Text>

        </CardContent>

      </Card>


      {/* =================================================
          HUMIDITY
      ================================================= */}

      <Card
        className="
          mb-4
          bg-cyan-50
          border-cyan-200
        "
      >

        <CardHeader>

          <CardDescription>
            💧 HUMIDITY
          </CardDescription>


          <CardTitle
            className="
              text-4xl
              text-cyan-700
            "
          >

            {humidity !==
            null

              ? `${humidity}%`

              : "--"}

          </CardTitle>

        </CardHeader>


        <CardContent>

          <Badge
            variant={
              humidityStatus ===
              "UNSAFE"

                ? "destructive"

                : "secondary"
            }
          >

            <Text>
              {humidityStatus}
            </Text>

          </Badge>

        </CardContent>

      </Card>


      {/* =================================================
          POWER + DEVICE
      ================================================= */}

      <View
        className="
          flex-row
          gap-3
          mb-4
        "
      >

        <Card
          className="
            flex-1
            bg-amber-50
            border-amber-200
          "
        >

          <CardHeader>

            <CardDescription>
              ⚡ POWER
            </CardDescription>


            <CardTitle
              className="
                text-amber-700
              "
            >
              {power
                ? "ON"
                : "OFF"}
            </CardTitle>

          </CardHeader>

        </Card>


        <Card
          className="
            flex-1
            bg-blue-50
            border-blue-200
          "
        >

          <CardHeader>

            <CardDescription>
              📡 DEVICE
            </CardDescription>


            <CardTitle
              className="
                text-blue-700
              "
            >
              {online
                ? "ONLINE"
                : "OFFLINE"}
            </CardTitle>

          </CardHeader>

        </Card>

      </View>


      {/* =================================================
          CHAMBER TEMPERATURES
      ================================================= */}

      <Text
        className="
          text-xl
          font-bold
          text-slate-800
          mb-3
        "
      >
        Chamber Temperatures
      </Text>


      {/* =================================================
          CHAMBER 1
      ================================================= */}

      <Card
        className="
          mb-4
          bg-sky-50
          border-sky-200
        "
      >

        <CardHeader>

          <CardTitle
            className="
              text-sky-800
            "
          >
            🌡 Chamber 1
          </CardTitle>

        </CardHeader>


        <CardContent>

          <View
            className="
              items-center
            "
          >

            <Text
              className="
                text-xs
                text-slate-500
                font-semibold
              "
            >
              CURRENT TEMPERATURE
            </Text>


            <Text
              className="
                text-4xl
                font-bold
                text-sky-700
                mt-2
              "
            >

              {chamber1Temperature !==
              null

                ? `${chamber1Temperature}°C`

                : "-- °C"}

            </Text>


            <Text
              className={`
                font-bold
                mt-3
                ${
                  getStatusColors(
                    chamber1Status
                  ).text
                }
              `}
            >
              {chamber1Status}
            </Text>


            {/* APPROX TIME TO REACH */}

            <View
              className="
                mt-5
                items-center
                rounded-xl
                bg-white
                border
                border-sky-200
                px-6
                py-3
                w-full
              "
            >

              <Text
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                "
              >
                Approx. time to reach
              </Text>


              <Text
                className="
                  text-xl
                  font-bold
                  text-slate-700
                  mt-1
                "
              >
                ---- hrs
              </Text>

            </View>


            {/* SET TEMPERATURE */}

            <View
              className="
                w-full
                border-t
                border-sky-200
                mt-5
                pt-4
                items-center
              "
            >

              <Text
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                "
              >
                SET TEMPERATURE
              </Text>


              <Text
                className="
                  text-2xl
                  font-bold
                  text-sky-800
                  mt-1
                "
              >

                {chamber1SetTemperature !==
                null

                  ? `${chamber1SetTemperature}°C`

                  : "-- °C"}

              </Text>


              <Text
                className="
                  text-xs
                  text-slate-500
                  text-center
                  mt-2
                "
              >
                Set physically on the VOOLER unit
              </Text>

            </View>

          </View>

        </CardContent>

      </Card>


      {/* =================================================
          CHAMBER 2
      ================================================= */}

      <Card
        className="
          mb-4
          bg-indigo-50
          border-indigo-200
        "
      >

        <CardHeader>

          <CardTitle
            className="
              text-indigo-800
            "
          >
            🌡 Chamber 2
          </CardTitle>

        </CardHeader>


        <CardContent>

          <View
            className="
              items-center
            "
          >

            <Text
              className="
                text-xs
                text-slate-500
                font-semibold
              "
            >
              CURRENT TEMPERATURE
            </Text>


            <Text
              className="
                text-4xl
                font-bold
                text-indigo-700
                mt-2
              "
            >

              {chamber2Temperature !==
              null

                ? `${chamber2Temperature}°C`

                : "-- °C"}

            </Text>


            <Text
              className={`
                font-bold
                mt-3
                ${
                  getStatusColors(
                    chamber2Status
                  ).text
                }
              `}
            >
              {chamber2Status}
            </Text>


            {/* APPROX TIME TO REACH */}

            <View
              className="
                mt-5
                items-center
                rounded-xl
                bg-white
                border
                border-indigo-200
                px-6
                py-3
                w-full
              "
            >

              <Text
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                "
              >
                Approx. time to reach
              </Text>


              <Text
                className="
                  text-xl
                  font-bold
                  text-slate-700
                  mt-1
                "
              >
                ---- hrs
              </Text>

            </View>


            {/* SET TEMPERATURE */}

            <View
              className="
                w-full
                border-t
                border-indigo-200
                mt-5
                pt-4
                items-center
              "
            >

              <Text
                className="
                  text-xs
                  text-slate-500
                  font-semibold
                "
              >
                SET TEMPERATURE
              </Text>


              <Text
                className="
                  text-2xl
                  font-bold
                  text-indigo-800
                  mt-1
                "
              >

                {chamber2SetTemperature !==
                null

                  ? `${chamber2SetTemperature}°C`

                  : "-- °C"}

              </Text>


              <Text
                className="
                  text-xs
                  text-slate-500
                  text-center
                  mt-2
                "
              >
                Set physically on the VOOLER unit
              </Text>

            </View>

          </View>

        </CardContent>

      </Card>


      {/* =================================================
          WEATHER
      ================================================= */}

      <Card
        className="
          mb-4
          bg-white
          border-teal-200
        "
      >

        <CardHeader>

          <CardTitle
            className="
              text-teal-800
            "
          >
            ☀️ Weather & Energy Planning
          </CardTitle>


          <CardDescription>

            {weatherLocation

              ? `Forecast for ${weatherLocation}`

              : "Storage-site forecast"}

          </CardDescription>


          <Text
            className="
              text-xs
              text-slate-500
              mt-1
            "
          >
            4-day solar planning
          </Text>

        </CardHeader>


        <CardContent>

          {weatherLoading ? (

            <Text
              className="
                text-slate-500
                text-center
                py-4
              "
            >
              Loading weather forecast...
            </Text>

          ) : null}


          {!weatherLoading &&
          weatherError ? (

            <View
              className="
                rounded-xl
                bg-amber-50
                border
                border-amber-200
                px-4
                py-4
              "
            >

              <Text
                className="
                  text-amber-700
                  font-semibold
                "
              >
                ☁️ {weatherError}
              </Text>

            </View>

          ) : null}


          {!weatherLoading &&
          !weatherError &&
          weatherForecast.length >
            0 ? (

            <View>

              {weatherForecast.map(
                (
                  day,
                  index
                ) => (

                  <View
                    key={
                      day.date ||
                      String(index)
                    }

                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      px-4
                      py-4
                      mb-3
                    "
                  >

                    <View
                      className="
                        flex-row
                        justify-between
                        items-start
                      "
                    >

                      <View
                        className="
                          flex-1
                          pr-3
                        "
                      >

                        <Text
                          className="
                            text-base
                            font-bold
                            text-slate-800
                          "
                        >

                          {getForecastDayLabel(
                            day.date,
                            index
                          )}

                        </Text>


                        <Text
                          className="
                            text-xs
                            text-slate-500
                            mt-1
                          "
                        >
                          {day.date ||
                            "--"}
                        </Text>

                      </View>


                      <Text
                        className="
                          text-4xl
                        "
                      >
                        {getWeatherIcon(
                          day.condition
                        )}
                      </Text>

                    </View>


                    <Text
                      className="
                        font-bold
                        text-slate-700
                        mt-3
                      "
                    >
                      {day.condition ||
                        "Forecast"}
                    </Text>


                    <View
                      className="
                        flex-row
                        items-baseline
                        mt-2
                      "
                    >

                      <Text
                        className="
                          text-2xl
                          font-bold
                          text-slate-800
                        "
                      >

                        {day.temperature
                          ?.max ??
                          "--"}
                        °C

                      </Text>


                      <Text
                        className="
                          text-sm
                          font-semibold
                          text-slate-500
                          ml-1
                        "
                      >

                        /{" "}
                        {day.temperature
                          ?.min ??
                          "--"}
                        °C

                      </Text>

                    </View>


                    <View
                      className="
                        mt-3
                        gap-2
                      "
                    >

                      <Text
                        className="
                          text-sm
                          text-slate-700
                        "
                      >
                        🌧️ Chance of rain:{" "}
                        <Text
                          className="
                            font-bold
                          "
                        >
                          {day
                            .precipitationProbability ??
                            "--"}
                          %
                        </Text>
                      </Text>


                      <Text
                        className="
                          text-sm
                          text-slate-700
                        "
                      >
                        ☁️ Cloud cover:{" "}
                        <Text
                          className="
                            font-bold
                          "
                        >
                          {day.cloudCover ??
                            "--"}
                          %
                        </Text>
                      </Text>


                      <Text
                        className="
                          text-sm
                          text-slate-700
                        "
                      >
                        ☀️ Sunshine:{" "}
                        <Text
                          className="
                            font-bold
                          "
                        >
                          {day.sunshineHours ??
                            "--"}{" "}
                          hrs
                        </Text>
                      </Text>


                      <Text
                        className="
                          text-sm
                          text-slate-700
                        "
                      >
                        🔆 Solar energy:{" "}
                        <Text
                          className="
                            font-bold
                          "
                        >
                          {day.solarRadiation ??
                            "--"}{" "}
                          MJ/m²
                        </Text>
                      </Text>

                    </View>


                    <View
                      className={`
                        self-start
                        rounded-full
                        border
                        px-3
                        py-2
                        mt-4
                        ${
                          getSolarBadgeClass(
                            day.solarAvailability
                          )
                        }
                      `}
                    >

                      <Text
                        className={`
                          text-xs
                          font-bold
                          ${
                            getSolarTextClass(
                              day.solarAvailability
                            )
                          }
                        `}
                      >

                        {day.solarAvailability ||
                          "UNKNOWN"}{" "}
                        SUNLIGHT

                      </Text>

                    </View>

                  </View>

                )
              )}


              {weatherForecast[0]
                ?.strategy ? (

                <View
                  className="
                    rounded-2xl
                    bg-teal-50
                    border
                    border-teal-200
                    px-4
                    py-5
                    mt-1
                  "
                >

                  <Text
                    className="
                      text-xs
                      font-bold
                      text-teal-700
                    "
                  >
                    TODAY&apos;S ENERGY PLAN
                  </Text>


                  <Text
                    className="
                      text-xl
                      font-bold
                      text-slate-800
                      mt-2
                    "
                  >
                    ⚡{" "}
                    {weatherForecast[0]
                      .strategy
                      ?.mode ||
                      "ENERGY PLANNING"}
                  </Text>


                  <Text
                    className="
                      text-slate-700
                      leading-6
                      mt-3
                    "
                  >

                    {weatherForecast[0]
                      .solarAvailability ===
                    "HIGH"

                      ? "VOOLER will prioritize chamber cooling and use available surplus solar energy to charge the PCM thermal storage."

                      : weatherForecast[0]
                          .solarAvailability ===
                        "MODERATE"

                        ? "VOOLER will maintain chamber cooling while balancing available solar energy, battery usage, and PCM charging."

                        : "VOOLER will conserve battery energy and rely more on stored PCM cooling to reduce compressor demand where possible."}

                  </Text>


                  <Text
                    className="
                      text-xs
                      text-slate-500
                      mt-3
                    "
                  >
                    Planning guidance is generated from the storage-site weather forecast and VOOLER&apos;s prototype energy-management rules.
                  </Text>

                </View>

              ) : null}

            </View>

          ) : null}


          {!weatherLoading &&
          !weatherError &&
          weatherForecast.length ===
            0 ? (

            <View
              className="
                rounded-xl
                bg-amber-50
                border
                border-amber-200
                px-4
                py-4
              "
            >

              <Text
                className="
                  text-amber-700
                  font-semibold
                "
              >
                ☁️ Weather forecast temporarily unavailable.
              </Text>

            </View>

          ) : null}

        </CardContent>

      </Card>


      {/* =================================================
          COOLING BACKUP
      ================================================= */}

      <Card
        className="
          mb-4
          bg-white
          border-slate-200
        "
      >

        <CardHeader>

          <CardDescription>
            ❄️ ESTIMATED COOLING BACKUP
          </CardDescription>


          <CardTitle
            className="
              text-3xl
              font-bold
              text-slate-800
              mt-2
            "
          >
            ---- hrs
          </CardTitle>

        </CardHeader>


        <CardContent>

          <Text
            className="
              text-slate-600
            "
          >
            Estimate available when device data is received
          </Text>


          <Pressable
            className="
              mt-3
            "

            onPress={() =>

              Alert.alert(
                "Estimated Cooling Backup",

                "Shows the estimated time your Vooler can keep the stored produce cool without sunlight, based on battery status, stored cooling capacity, and data from previous testing cycles.\n\nNote: Actual backup time may vary with environmental and operating conditions."
              )

            }
          >

            <Text
              className="
                text-teal-700
                font-bold
              "
            >
              ? About this estimate
            </Text>

          </Pressable>

        </CardContent>

      </Card>


      {/* =================================================
          EMERGENCY CONTROL
      ================================================= */}

      <Card
        className={

          emergencyShutdown

            ? "mb-5 bg-red-50 border-red-500"

            : "mb-5 bg-emerald-50 border-emerald-200"

        }
      >

        <CardHeader>

          <CardDescription>
            🚨 EMERGENCY CONTROL
          </CardDescription>


          <CardTitle
            className={

              emergencyShutdown

                ? "text-red-700"

                : "text-emerald-700"

            }
          >

            {emergencyShutdown

              ? "SHUTDOWN ACTIVE"

              : "SYSTEM RUNNING"}

          </CardTitle>

        </CardHeader>


        <CardContent>

          <Text
            className="
              text-slate-600
              mb-4
            "
          >

            {emergencyShutdown

              ? "Cooling system has been commanded to stop."

              : "Use this control only in an emergency."}

          </Text>


          {emergencyError ? (

            <Text
              className="
                text-red-700
                mb-4
                font-semibold
              "
            >
              ⚠ {emergencyError}
            </Text>

          ) : null}


          {!emergencyShutdown ? (

            <Pressable
              onPress={
                handleEmergencyShutdown
              }

              disabled={
                emergencyLoading
              }

              className="
                rounded-xl
                bg-red-600
                px-4
                py-4
              "
            >

              <Text
                className="
                  text-white
                  text-center
                  font-bold
                "
              >

                {emergencyLoading

                  ? "SENDING..."

                  : "EMERGENCY SHUTDOWN"}

              </Text>

            </Pressable>

          ) : (

            <Pressable
              onPress={
                handleResumeSystem
              }

              disabled={
                emergencyLoading
              }

              className="
                rounded-xl
                bg-emerald-600
                px-4
                py-4
              "
            >

              <Text
                className="
                  text-white
                  text-center
                  font-bold
                "
              >

                {emergencyLoading

                  ? "SENDING..."

                  : "RESUME SYSTEM"}

              </Text>

            </Pressable>

          )}

        </CardContent>

      </Card>


      {/* =================================================
          MONITORING HISTORY
      ================================================= */}

      <View
        className="
          rounded-2xl
          bg-violet-100
          px-4
          py-4
          mb-4
        "
      >

        <Text
          className="
            text-xl
            font-bold
            text-violet-800
          "
        >
          📊 Monitoring History
        </Text>


        <Text
          className="
            text-sm
            text-violet-700
            mt-1
          "
        >
          Select a parameter to view its recent history
        </Text>

      </View>


      {/* GRAPH SELECTOR */}

      <ScrollView
        horizontal

        showsHorizontalScrollIndicator={
          false
        }

        className="
          mb-4
        "
      >

        <View
          className="
            flex-row
            gap-2
            pr-5
          "
        >


          <Pressable
            onPress={() =>
              setSelectedHistoryGraph(
                "temperature"
              )
            }

            className={`
              rounded-full
              border
              px-4
              py-3
              ${
                selectedHistoryGraph ===
                "temperature"

                  ? "bg-teal-700 border-teal-700"

                  : "bg-white border-slate-300"
              }
            `}
          >

            <Text
              className={`
                font-bold
                ${
                  selectedHistoryGraph ===
                  "temperature"

                    ? "text-white"

                    : "text-slate-700"
                }
              `}
            >
              Temperature
            </Text>

          </Pressable>


          <Pressable
            onPress={() =>
              setSelectedHistoryGraph(
                "humidity"
              )
            }

            className={`
              rounded-full
              border
              px-4
              py-3
              ${
                selectedHistoryGraph ===
                "humidity"

                  ? "bg-teal-700 border-teal-700"

                  : "bg-white border-slate-300"
              }
            `}
          >

            <Text
              className={`
                font-bold
                ${
                  selectedHistoryGraph ===
                  "humidity"

                    ? "text-white"

                    : "text-slate-700"
                }
              `}
            >
              Humidity
            </Text>

          </Pressable>


          <Pressable
            onPress={() =>
              setSelectedHistoryGraph(
                "power"
              )
            }

            className={`
              rounded-full
              border
              px-4
              py-3
              ${
                selectedHistoryGraph ===
                "power"

                  ? "bg-teal-700 border-teal-700"

                  : "bg-white border-slate-300"
              }
            `}
          >

            <Text
              className={`
                font-bold
                ${
                  selectedHistoryGraph ===
                  "power"

                    ? "text-white"

                    : "text-slate-700"
                }
              `}
            >
              Power
            </Text>

          </Pressable>


          <Pressable
            onPress={() =>
              setSelectedHistoryGraph(
                "connectivity"
              )
            }

            className={`
              rounded-full
              border
              px-4
              py-3
              ${
                selectedHistoryGraph ===
                "connectivity"

                  ? "bg-teal-700 border-teal-700"

                  : "bg-white border-slate-300"
              }
            `}
          >

            <Text
              className={`
                font-bold
                ${
                  selectedHistoryGraph ===
                  "connectivity"

                    ? "text-white"

                    : "text-slate-700"
                }
              `}
            >
              Connectivity
            </Text>

          </Pressable>

        </View>

      </ScrollView>


      {/* =================================================
          ONE HISTORY GRAPH
      ================================================= */}

      <Card
        className="
          mb-5
          bg-white
          border-slate-200
        "
      >

        <CardHeader>

          <CardTitle>

            {selectedHistoryGraph ===
            "temperature"

              ? "🌡 Chamber Temperatures"

              : selectedHistoryGraph ===
                "humidity"

                ? "💧 Humidity"

                : selectedHistoryGraph ===
                  "power"

                  ? "⚡ Power Status"

                  : "📡 Device Connectivity"}

          </CardTitle>


          <CardDescription>

            {selectedHistoryGraph ===
            "temperature"

              ? "Chamber 1 and Chamber 2 temperature history"

              : selectedHistoryGraph ===
                "humidity"

                ? "Humidity history"

                : selectedHistoryGraph ===
                  "power"

                  ? "1 = ON • 0 = FAILURE"

                  : "1 = ONLINE • 0 = OFFLINE"}

          </CardDescription>

        </CardHeader>


        <CardContent>


          {/* =============================================
              COMBINED TEMPERATURE GRAPH
          ============================================= */}

          {selectedHistoryGraph ===
            "temperature" && (

            temperatureHistory.length >
            0 ? (

              <View>


                {/* LEGEND */}

                <View
                  className="
                    flex-row
                    items-center
                    justify-center
                    gap-6
                    mb-4
                  "
                >

                  <View
                    className="
                      flex-row
                      items-center
                      gap-2
                    "
                  >

                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor:
                          "#0ea5e9",
                      }}
                    />

                    <Text
                      className="
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Chamber 1
                    </Text>

                  </View>


                  <View
                    className="
                      flex-row
                      items-center
                      gap-2
                    "
                  >

                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor:
                          "#6366f1",
                      }}
                    />

                    <Text
                      className="
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      Chamber 2
                    </Text>

                  </View>

                </View>


                <ScrollView
                  horizontal

                  showsHorizontalScrollIndicator={
                    false
                  }
                >

                  <LineChart
                    data={{
                      labels:
                        createLabels(
                          temperatureHistory
                        ),

                      datasets: [

                        {
                          data:
                            temperatureHistory.map(
                              (
                                reading
                              ) =>
                                reading
                                  .chamber1Temperature as number
                            ),

                          color:
                            (
                              opacity = 1
                            ) =>
                              `rgba(14, 165, 233, ${opacity})`,

                          strokeWidth:
                            3,
                        },

                        {
                          data:
                            temperatureHistory.map(
                              (
                                reading
                              ) =>
                                reading
                                  .chamber2Temperature as number
                            ),

                          color:
                            (
                              opacity = 1
                            ) =>
                              `rgba(99, 102, 241, ${opacity})`,

                          strokeWidth:
                            3,
                        },

                      ],
                    }}

                    width={
                      Math.max(
                        CHART_WIDTH,
                        temperatureHistory.length *
                          52
                      )
                    }

                    height={250}

                    yAxisSuffix="°C"

                    chartConfig={
                      chartConfig
                    }

                    bezier

                    style={{
                      borderRadius:
                        16,
                    }}
                  />

                </ScrollView>

              </View>

            ) : (

              <Text
                className="
                  text-slate-500
                  py-5
                  text-center
                "
              >
                Waiting for chamber temperature history data.
              </Text>

            )

          )}


          {/* =============================================
              HUMIDITY GRAPH
          ============================================= */}

          {selectedHistoryGraph ===
            "humidity" && (

            humidityHistory.length >
            0 ? (

              <ScrollView
                horizontal

                showsHorizontalScrollIndicator={
                  false
                }
              >

                <LineChart
                  data={{
                    labels:
                      createLabels(
                        humidityHistory
                      ),

                    datasets: [
                      {
                        data:
                          humidityHistory.map(
                            (
                              reading
                            ) =>
                              reading
                                .humidity as number
                          ),
                      },
                    ],
                  }}

                  width={
                    Math.max(
                      CHART_WIDTH,
                      humidityHistory.length *
                        52
                    )
                  }

                  height={240}

                  yAxisSuffix="%"

                  chartConfig={
                    chartConfig
                  }

                  bezier

                  style={{
                    borderRadius:
                      16,
                  }}
                />

              </ScrollView>

            ) : (

              <Text
                className="
                  text-slate-500
                  py-5
                  text-center
                "
              >
                Waiting for humidity history data.
              </Text>

            )

          )}


          {/* =============================================
              POWER GRAPH
          ============================================= */}

          {selectedHistoryGraph ===
            "power" && (

            powerHistory.length >
            0 ? (

              <ScrollView
                horizontal

                showsHorizontalScrollIndicator={
                  false
                }
              >

                <LineChart
                  data={{
                    labels:
                      createLabels(
                        powerHistory
                      ),

                    datasets: [
                      {
                        data:
                          powerHistory.map(
                            (
                              reading
                            ) =>
                              reading.power
                                ? 1
                                : 0
                          ),
                      },
                    ],
                  }}

                  width={
                    Math.max(
                      CHART_WIDTH,
                      powerHistory.length *
                        52
                    )
                  }

                  height={220}

                  fromZero

                  chartConfig={{
                    ...chartConfig,

                    decimalPlaces:
                      0,
                  }}

                  style={{
                    borderRadius:
                      16,
                  }}
                />

              </ScrollView>

            ) : (

              <Text
                className="
                  text-slate-500
                  py-5
                  text-center
                "
              >
                Waiting for power history data.
              </Text>

            )

          )}


          {/* =============================================
              CONNECTIVITY GRAPH
          ============================================= */}

          {selectedHistoryGraph ===
            "connectivity" && (

            connectivityHistory.length >
            0 ? (

              <ScrollView
                horizontal

                showsHorizontalScrollIndicator={
                  false
                }
              >

                <LineChart
                  data={{
                    labels:
                      createLabels(
                        connectivityHistory
                      ),

                    datasets: [
                      {
                        data:
                          connectivityHistory.map(
                            (
                              reading
                            ) =>
                              reading.online ===
                              false

                                ? 0

                                : 1
                          ),
                      },
                    ],
                  }}

                  width={
                    Math.max(
                      CHART_WIDTH,
                      connectivityHistory.length *
                        52
                    )
                  }

                  height={220}

                  fromZero

                  chartConfig={{
                    ...chartConfig,

                    decimalPlaces:
                      0,
                  }}

                  style={{
                    borderRadius:
                      16,
                  }}
                />

              </ScrollView>

            ) : (

              <Text
                className="
                  text-slate-500
                  py-5
                  text-center
                "
              >
                Waiting for connectivity history data.
              </Text>

            )

          )}

        </CardContent>

      </Card>


      {/* =================================================
          LAST DATA
      ================================================= */}

      <Card
        className="
          bg-slate-100
          border-slate-200
        "
      >

        <CardHeader>

          <CardDescription>
            📡 LAST DATA RECEIVED
          </CardDescription>


          <CardTitle
            className="
              text-base
              text-slate-700
            "
          >
            {lastUpdated ||
              "Waiting for data..."}
          </CardTitle>

        </CardHeader>

      </Card>


    </ScrollView>

  );

}