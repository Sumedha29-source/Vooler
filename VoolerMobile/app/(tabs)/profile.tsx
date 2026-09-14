import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

import {
  router,
} from "expo-router";

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


type Farmer = {
  id?: string;
  name?: string;
  phone?: string;
  simNumber?: string;
  storageId?: string;
  deviceKey?: string;
  language?: string;
};


export default function ProfileScreen() {

  const [
    farmer,
    setFarmer,
  ] =
    useState<Farmer | null>(
      null
    );


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


          if (stored) {

            setFarmer(
              JSON.parse(
                stored
              )
            );

          }

        }
        catch (err) {

          console.log(
            "PROFILE LOAD ERROR:",
            err
          );

        }

      };


    loadFarmer();

  }, []);


  // ===================================================
  // LANGUAGE NAME
  // ===================================================

  const getLanguageName =
    () => {

      switch (
        farmer?.language
      ) {

        case "bn":
          return "বাংলা";

        case "hi":
          return "हिन्दी";

        case "as":
          return "অসমীয়া";

        default:
          return "English";

      }

    };


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout =
    async () => {

      await AsyncStorage.removeItem(
        "voolerFarmer"
      );


      router.replace(
        "/"
      );

    };


  const handleLogout =
    () => {

      Alert.alert(
        "Logout",
        "Are you sure you want to logout from VOOLER?",
        [
          {
            text:
              "Cancel",

            style:
              "cancel",
          },

          {
            text:
              "Logout",

            style:
              "destructive",

            onPress:
              logout,
          },
        ]
      );

    };


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

    >


      {/* PROFILE HEADER */}

      <View
        className="
          rounded-3xl
          bg-teal-700
          px-6
          py-8
          mb-5
          items-center
        "
      >

        <View
          className="
            w-24
            h-24
            rounded-full
            bg-white/20
            items-center
            justify-center
            mb-4
          "
        >

          <Text
            className="
              text-5xl
            "
          >

            👨‍🌾

          </Text>

        </View>


        <Text
          className="
            text-white
            text-2xl
            font-bold
            text-center
          "
        >

          {farmer?.name ||
            "Farmer"}

        </Text>


        <Text
          className="
            text-teal-100
            mt-2
          "
        >

          VOOLER Farmer Account

        </Text>

      </View>


      {/* ACCOUNT INFORMATION */}

      <Text
        className="
          text-xl
          font-bold
          text-slate-800
          mb-3
        "
      >

        Account Information

      </Text>


      <Card
        className="
          mb-4
          bg-blue-50
          border-blue-200
        "
      >

        <CardContent
          className="pt-5"
        >

          <Text
            className="
              text-xs
              text-slate-500
              font-semibold
            "
          >

            👤 FARMER NAME

          </Text>


          <Text
            className="
              text-xl
              font-bold
              text-blue-800
              mt-1
            "
          >

            {farmer?.name ||
              "--"}

          </Text>

        </CardContent>

      </Card>


      <Card
        className="
          mb-4
          bg-emerald-50
          border-emerald-200
        "
      >

        <CardContent
          className="pt-5"
        >

          <Text
            className="
              text-xs
              text-slate-500
              font-semibold
            "
          >

            📱 MOBILE NUMBER

          </Text>


          <Text
            className="
              text-xl
              font-bold
              text-emerald-700
              mt-1
            "
          >

            {farmer?.phone
              ? `+91 ${farmer.phone}`
              : "--"}

          </Text>

        </CardContent>

      </Card>


      <Card
        className="
          mb-4
          bg-violet-50
          border-violet-200
        "
      >

        <CardContent
          className="pt-5"
        >

          <Text
            className="
              text-xs
              text-slate-500
              font-semibold
            "
          >

            🧊 STORAGE ID

          </Text>


          <Text
            className="
              text-2xl
              font-bold
              text-violet-700
              mt-1
            "
          >

            {farmer?.storageId ||
              "--"}

          </Text>

        </CardContent>

      </Card>


      <Card
        className="
          mb-4
          bg-amber-50
          border-amber-200
        "
      >

        <CardContent
          className="pt-5"
        >

          <Text
            className="
              text-xs
              text-slate-500
              font-semibold
            "
          >

            📡 STORAGE SIM

          </Text>


          <Text
            className="
              text-xl
              font-bold
              text-amber-700
              mt-1
            "
          >

            {farmer?.simNumber
              ? `+91 ${farmer.simNumber}`
              : "--"}

          </Text>

        </CardContent>

      </Card>


      <Card
        className="
          mb-5
          bg-cyan-50
          border-cyan-200
        "
      >

        <CardContent
          className="pt-5"
        >

          <Text
            className="
              text-xs
              text-slate-500
              font-semibold
            "
          >

            🌐 PREFERRED LANGUAGE

          </Text>


          <Text
            className="
              text-xl
              font-bold
              text-cyan-700
              mt-1
            "
          >

            {getLanguageName()}

          </Text>

        </CardContent>

      </Card>


      {/* STORAGE CONNECTION */}

      <Text
        className="
          text-xl
          font-bold
          text-slate-800
          mb-3
        "
      >

        Storage Connection

      </Text>


      <Card
        className="
          mb-5
          bg-indigo-50
          border-indigo-200
        "
      >

        <CardHeader>

          <CardDescription>
            DEVICE CONNECTION
          </CardDescription>


          <CardTitle
            className="
              text-indigo-800
            "
          >

            📡 VOOLER Storage Unit

          </CardTitle>

        </CardHeader>


        <CardContent>

          <View
            className="
              flex-row
              items-center
              justify-between
            "
          >

            <Text
              className="
                text-slate-600
              "
            >

              Assigned Storage

            </Text>


            <Text
              className="
                font-bold
                text-indigo-700
              "
            >

              {farmer?.storageId ||
                "--"}

            </Text>

          </View>

        </CardContent>

      </Card>


      {/* LOGOUT */}

      <Pressable

        onPress={
          handleLogout
        }

        className="
          rounded-2xl
          bg-red-600
          px-5
          py-4
        "

      >

        <Text
          className="
            text-white
            text-center
            font-bold
            text-base
          "
        >

          LOGOUT

        </Text>

      </Pressable>


      <Text
        className="
          text-center
          text-slate-400
          text-xs
          mt-6
        "
      >

        VOOLER • Smart Cold Storage System

      </Text>


    </ScrollView>

  );

}