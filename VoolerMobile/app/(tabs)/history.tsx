import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  RefreshControl,
  ScrollView,
  View,
} from "react-native";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

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


type Farmer = {
  name?: string;
  phone?: string;
  storageId?: string;
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


export default function HistoryScreen() {

  const [
    farmer,
    setFarmer,
  ] =
    useState<Farmer | null>(
      null
    );


  const [
    history,
    setHistory,
  ] =
    useState<Reading[]>([]);


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
  // FETCH HISTORY
  // ===================================================

  const fetchHistory =
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
              "Unable to load history."
            );

          }


          setHistory(

            Array.isArray(
              data.history
            )

              ? data.history

              : []

          );


          setError("");

        }
        catch (err: any) {

          console.log(
            "HISTORY FETCH ERROR:",
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


    fetchHistory();

  }, [
    farmer?.storageId,
    fetchHistory,
  ]);


  // ===================================================
  // FORMAT TIME
  // ===================================================

  const formatTime =
    (
      reading:
        Reading
    ) => {

      const raw =
        reading.createdAt ||
        reading.timestamp ||
        reading.time;


      if (!raw) {

        return "Unknown time";

      }


      return new Date(
        raw
      ).toLocaleString();

    };


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
            fetchHistory
          }
        />

      }
    >


      {/* HEADER */}

      <View
        className="
          rounded-3xl
          bg-violet-700
          px-6
          py-7
          mb-5
        "
      >

        <Text
          className="
            text-white
            text-3xl
            font-bold
          "
        >

          📊 History

        </Text>


        <Text
          className="
            text-violet-100
            mt-2
          "
        >

          Storage monitoring records

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
              font-semibold
            "
          >

            {farmer?.name ||
              "Farmer"}

          </Text>


          <Text
            className="
              text-violet-100
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


      {/* COUNT */}

      <Card
        className="
          mb-5
          bg-purple-50
          border-purple-200
        "
      >

        <CardContent
          className="
            pt-5
            flex-row
            items-center
            justify-between
          "
        >

          <View>

            <Text
              className="
                text-slate-500
                text-xs
                font-semibold
              "
            >

              RECENT READINGS

            </Text>


            <Text
              className="
                text-purple-700
                text-3xl
                font-bold
                mt-1
              "
            >

              {history.length}

            </Text>

          </View>


          <Text
            className="
              text-4xl
            "
          >

            📈

          </Text>

        </CardContent>

      </Card>


      {history.length === 0 ? (

        <Card
          className="
            bg-slate-100
            border-slate-200
          "
        >

          <CardContent
            className="
              pt-6
              pb-6
              items-center
            "
          >

            <Text
              className="
                text-4xl
                mb-3
              "
            >

              📭

            </Text>


            <Text
              className="
                font-bold
                text-lg
              "
            >

              No readings yet

            </Text>


            <Text
              className="
                text-slate-500
                text-center
                mt-2
              "
            >

              Sensor readings will appear here once VOOLER starts sending data.

            </Text>

          </CardContent>

        </Card>

      ) : (

        [...history]
          .reverse()
          .map(
            (
              reading,
              index
            ) => (

              <Card
                key={
                  reading._id ||
                  `${formatTime(
                    reading
                  )}-${index}`
                }

                className="
                  mb-4
                  bg-white
                  border-slate-200
                "
              >

                <CardHeader>

                  <CardDescription>

                    READING #
                    {history.length -
                      index}

                  </CardDescription>


                  <CardTitle
                    className="
                      text-base
                      text-slate-800
                    "
                  >

                    🕒{" "}
                    {formatTime(
                      reading
                    )}

                  </CardTitle>

                </CardHeader>


                <CardContent>


                  {/* CHAMBER 1 */}

                  <View
                    className="
                      rounded-2xl
                      bg-sky-50
                      border
                      border-sky-200
                      p-4
                      mb-4
                    "
                  >

                    <Text
                      className="
                        text-sky-800
                        font-bold
                        mb-3
                      "
                    >

                      🌡 Chamber 1

                    </Text>


                    <Text
                      className="
                        text-xs
                        text-slate-500
                      "
                    >

                      CURRENT TEMPERATURE

                    </Text>


                    <Text
                      className="
                        text-3xl
                        font-bold
                        text-sky-700
                        mt-2
                      "
                    >

                      {typeof reading
                        .chamber1Temperature ===
                      "number"

                        ? `${reading.chamber1Temperature}°C`

                        : "-- °C"}

                    </Text>

                  </View>


                  {/* CHAMBER 2 */}

                  <View
                    className="
                      rounded-2xl
                      bg-indigo-50
                      border
                      border-indigo-200
                      p-4
                      mb-4
                    "
                  >

                    <Text
                      className="
                        text-indigo-800
                        font-bold
                        mb-3
                      "
                    >

                      🌡 Chamber 2

                    </Text>


                    <Text
                      className="
                        text-xs
                        text-slate-500
                      "
                    >

                      CURRENT TEMPERATURE

                    </Text>


                    <Text
                      className="
                        text-3xl
                        font-bold
                        text-indigo-700
                        mt-2
                      "
                    >

                      {typeof reading
                        .chamber2Temperature ===
                      "number"

                        ? `${reading.chamber2Temperature}°C`

                        : "-- °C"}

                    </Text>

                  </View>


                  {/* HUMIDITY + POWER */}

                  <View
                    className="
                      flex-row
                      gap-3
                      mb-3
                    "
                  >

                    <View
                      className="
                        flex-1
                        rounded-2xl
                        bg-cyan-50
                        border
                        border-cyan-200
                        p-4
                      "
                    >

                      <Text
                        className="
                          text-xs
                          text-slate-500
                        "
                      >

                        💧 HUMIDITY

                      </Text>


                      <Text
                        className="
                          text-xl
                          font-bold
                          text-cyan-700
                          mt-2
                        "
                      >

                        {typeof reading
                          .humidity ===
                        "number"

                          ? `${reading.humidity}%`

                          : "--"}

                      </Text>

                    </View>


                    <View
                      className="
                        flex-1
                        rounded-2xl
                        bg-amber-50
                        border
                        border-amber-200
                        p-4
                      "
                    >

                      <Text
                        className="
                          text-xs
                          text-slate-500
                        "
                      >

                        ⚡ POWER

                      </Text>


                      <Text
                        className="
                          text-xl
                          font-bold
                          text-amber-700
                          mt-2
                        "
                      >

                        {reading.power === true
                          ? "ON"
                          : "OFF"}

                      </Text>

                    </View>

                  </View>


                  {/* DEVICE */}

                  <View
                    className="
                      rounded-2xl
                      bg-blue-50
                      border
                      border-blue-200
                      p-4
                    "
                  >

                    <Text
                      className="
                        text-xs
                        text-slate-500
                      "
                    >

                      📡 DEVICE STATUS

                    </Text>


                    <Text
                      className="
                        text-xl
                        font-bold
                        text-blue-700
                        mt-2
                      "
                    >

                      {reading.online === false
                        ? "OFFLINE"
                        : "ONLINE"}

                    </Text>

                  </View>


                </CardContent>

              </Card>

            )
          )

      )}


    </ScrollView>

  );

}