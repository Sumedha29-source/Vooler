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

  humidity?: number;

  power?: boolean;
  online?: boolean;

  timestamp?: string;
  createdAt?: string;
  time?: string;
};


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
      getReadingTime(
        reading
      );


    if (!raw) {

      return "";

    }


    return new Date(
      raw
    ).toLocaleTimeString(
      [],
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
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


          setFarmer(
            JSON.parse(
              stored
            )
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

          setLoading(
            true
          );


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
            data.message
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
            data.message
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
  // HISTORY FILTERS
  // ===================================================

  const chamber1History =
    useMemo(
      () =>
        history.filter(
          (reading) =>
            typeof reading
              .chamber1Temperature ===
            "number"
        ),

      [history]
    );


  const chamber2History =
    useMemo(
      () =>
        history.filter(
          (reading) =>
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
          onRefresh={
            fetchDashboard
          }
        />

      }
    >


      {/* HEADER */}

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


      {/* OVERALL */}

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


      {/* HUMIDITY */}

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


      {/* POWER + DEVICE */}

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


      {/* CHAMBERS */}

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


      {/* CHAMBER 1 */}

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
                mt-4
                ${
                  getStatusColors(
                    chamber1Status
                  ).text
                }
              `}
            >

              {chamber1Status}

            </Text>

          </View>

        </CardContent>

      </Card>


      {/* CHAMBER 2 */}

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
                mt-4
                ${
                  getStatusColors(
                    chamber2Status
                  ).text
                }
              `}
            >

              {chamber2Status}

            </Text>

          </View>

        </CardContent>

      </Card>


      {/* EMERGENCY */}

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


      {/* MONITORING HISTORY */}

      <View
        className="
          rounded-2xl
          bg-violet-100
          px-4
          py-3
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

      </View>


      {/* CHAMBER 1 GRAPH */}

      <Card
        className="
          mb-4
          bg-sky-50
          border-sky-200
        "
      >

        <CardHeader>

          <CardTitle>
            🌡 Chamber 1 History
          </CardTitle>

          <CardDescription>
            Temperature history
          </CardDescription>

        </CardHeader>


        <CardContent>

          {chamber1History.length >
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
                      chamber1History
                    ),

                  datasets: [
                    {
                      data:
                        chamber1History.map(
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
                  ],
                }}

                width={
                  Math.max(
                    CHART_WIDTH,
                    chamber1History.length *
                      52
                  )
                }

                height={240}

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

          ) : (

            <Text
              className="
                text-slate-500
              "
            >

              Waiting for Chamber 1 history data.

            </Text>

          )}

        </CardContent>

      </Card>


      {/* CHAMBER 2 GRAPH */}

      <Card
        className="
          mb-4
          bg-indigo-50
          border-indigo-200
        "
      >

        <CardHeader>

          <CardTitle>
            🌡 Chamber 2 History
          </CardTitle>

          <CardDescription>
            Temperature history
          </CardDescription>

        </CardHeader>


        <CardContent>

          {chamber2History.length >
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
                      chamber2History
                    ),

                  datasets: [
                    {
                      data:
                        chamber2History.map(
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
                          `rgba(79, 70, 229, ${opacity})`,

                      strokeWidth:
                        3,
                    },
                  ],
                }}

                width={
                  Math.max(
                    CHART_WIDTH,
                    chamber2History.length *
                      52
                  )
                }

                height={240}

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

          ) : (

            <Text
              className="
                text-slate-500
              "
            >

              Waiting for Chamber 2 history data.

            </Text>

          )}

        </CardContent>

      </Card>


      {/* HUMIDITY GRAPH */}

      <Card
        className="
          mb-4
          bg-cyan-50
          border-cyan-200
        "
      >

        <CardHeader>

          <CardTitle>
            💧 Humidity History
          </CardTitle>

        </CardHeader>


        <CardContent>

          {humidityHistory.length >
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

            <Text>
              Waiting for humidity data.
            </Text>

          )}

        </CardContent>

      </Card>


      {/* POWER GRAPH */}

      <Card
        className="
          mb-4
          bg-amber-50
          border-amber-200
        "
      >

        <CardHeader>

          <CardTitle>
            ⚡ Power History
          </CardTitle>

          <CardDescription>
            1 = ON • 0 = FAILURE
          </CardDescription>

        </CardHeader>


        <CardContent>

          {powerHistory.length >
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

            <Text>
              Waiting for power data.
            </Text>

          )}

        </CardContent>

      </Card>


      {/* CONNECTIVITY */}

      <Card
        className="
          mb-4
          bg-blue-50
          border-blue-200
        "
      >

        <CardHeader>

          <CardTitle>
            📡 Device Connectivity
          </CardTitle>

          <CardDescription>
            1 = ONLINE • 0 = OFFLINE
          </CardDescription>

        </CardHeader>


        <CardContent>

          {connectivityHistory.length >
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

            <Text>
              Waiting for connectivity data.
            </Text>

          )}

        </CardContent>

      </Card>


      {/* LAST UPDATE */}

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