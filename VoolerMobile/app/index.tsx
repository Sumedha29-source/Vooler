import {
  useState,
} from "react";

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

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
  Input,
} from "@/components/ui/input";

import {
  Text,
} from "@/components/ui/text";


const API_BASE_URL =
  "https://vooler.onrender.com";


export default function LoginScreen() {

  const [
    name,
    setName,
  ] =
    useState("");


  const [
    phone,
    setPhone,
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


  // ===================================================
  // LOGIN
  // ===================================================

  const handleLogin =
    async () => {

      const cleanName =
        name.trim();


      const cleanPhone =
        phone
          .trim()
          .replace(
            /\D/g,
            ""
          );


      if (
        !cleanName ||
        !cleanPhone
      ) {

        setError(
          "Please enter your name and mobile number."
        );

        return;

      }


      if (
        !/^\d{10}$/.test(
          cleanPhone
        )
      ) {

        setError(
          "Mobile number must contain exactly 10 digits."
        );

        return;

      }


      try {

        setLoading(
          true
        );

        setError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  name:
                    cleanName,

                  phone:
                    cleanPhone,
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Login failed."
          );

        }


        if (!data.farmer) {

          throw new Error(
            "Farmer information was not returned."
          );

        }


        await AsyncStorage.setItem(
          "voolerFarmer",
          JSON.stringify(
            data.farmer
          )
        );


        router.replace(
          "/(tabs)/dashboard" as never
        );

      }
      catch (err: any) {

        console.log(
          "LOGIN ERROR:",
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

    };


  return (

    <KeyboardAvoidingView

      className="
        flex-1
        bg-slate-50
      "

      behavior={
        Platform.OS ===
        "ios"

          ? "padding"

          : undefined
      }

    >

      <ScrollView

        className="flex-1"

        contentContainerStyle={{
          flexGrow:
            1,
        }}

        keyboardShouldPersistTaps="handled"

      >

        <View
          className="
            flex-1
            px-5
            pt-12
            pb-10
          "
        >


          {/* =================================================
              VOOLER BRAND HEADER
          ================================================= */}

          <View
            className="
              rounded-3xl
              bg-teal-700
              px-6
              py-10
              items-center
              mb-6
            "
          >


            {/* VOOLER LOGO IMAGE */}

            <Image

              source={
                require(
                  "../assets/images/vooler-icon.png"
                )
              }

              style={{
                width:
                  110,

                height:
                  110,

                marginBottom:
                  16,
              }}

              resizeMode="contain"

            />


            {/* VOOLER NAME */}

            <Text
              className="
                text-white
                text-4xl
                font-bold
                tracking-wider
              "
            >

              VOOLER

            </Text>


            {/* SUBTITLE */}

            <Text
              className="
                text-teal-100
                text-center
                mt-3
              "
            >

              Smart Cold Storage Monitoring

            </Text>


          </View>


          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <Card
            className="
              bg-white
              border-teal-100
            "
          >

            <CardHeader>


              <CardDescription>

                FARMER ACCESS

              </CardDescription>


              <CardTitle
                className="
                  text-2xl
                  text-teal-800
                "
              >

                Farmer Login

              </CardTitle>


              <Text
                className="
                  text-slate-500
                  mt-1
                "
              >

                Enter your registered farmer details.

              </Text>


            </CardHeader>


            <CardContent>


              {/* =================================================
                  ERROR MESSAGE
              ================================================= */}

              {error ? (

                <View
                  className="
                    mb-4
                    rounded-xl
                    border
                    border-red-300
                    bg-red-50
                    px-4
                    py-3
                  "
                >

                  <Text
                    className="
                      text-red-700
                      font-semibold
                    "
                  >

                    ⚠ {error}

                  </Text>

                </View>

              ) : null}


              {/* =================================================
                  FARMER NAME
              ================================================= */}

              <Text
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                "
              >

                👤 Farmer Name

              </Text>


              <Input

                value={
                  name
                }

                onChangeText={
                  setName
                }

                placeholder=
                  "Enter your registered name"

                autoCapitalize=
                  "words"

                editable={
                  !loading
                }

                className="
                  mb-4
                  bg-slate-50
                "

              />


              {/* =================================================
                  MOBILE NUMBER
              ================================================= */}

              <Text
                className="
                  text-sm
                  font-semibold
                  text-slate-700
                  mb-2
                "
              >

                📱 Mobile Number

              </Text>


              <Input

                value={
                  phone
                }

                onChangeText={
                  (
                    value
                  ) => {

                    const digitsOnly =
                      value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          10
                        );


                    setPhone(
                      digitsOnly
                    );

                  }
                }

                placeholder=
                  "Enter 10-digit mobile number"

                keyboardType=
                  "phone-pad"

                maxLength={
                  10
                }

                editable={
                  !loading
                }

                className="
                  mb-6
                  bg-slate-50
                "

              />


              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}

              <Pressable

                disabled={
                  loading
                }

                onPress={
                  handleLogin
                }

                className="
                  rounded-2xl
                  bg-teal-700
                  px-4
                  py-4
                "

                style={{
                  opacity:
                    loading

                      ? 0.6

                      : 1,
                }}

              >

                <Text
                  className="
                    text-center
                    text-white
                    font-bold
                    text-base
                  "
                >

                  {
                    loading

                      ? "LOGGING IN..."

                      : "LOGIN TO VOOLER"
                  }

                </Text>

              </Pressable>


              {/* =================================================
                  DIVIDER
              ================================================= */}

              <View
                className="
                  flex-row
                  items-center
                  my-6
                "
              >

                <View
                  className="
                    flex-1
                    h-px
                    bg-slate-200
                  "
                />


                <Text
                  className="
                    mx-4
                    text-slate-400
                    text-sm
                    font-semibold
                  "
                >

                  OR

                </Text>


                <View
                  className="
                    flex-1
                    h-px
                    bg-slate-200
                  "
                />

              </View>


              {/* =================================================
                  ADMIN LOGIN
              ================================================= */}

              <Pressable

                disabled={
                  loading
                }

                onPress={
                  () =>
                    router.push(
                      "/admin" as never
                    )
                }

                className="
                  rounded-2xl
                  border
                  border-violet-300
                  bg-violet-50
                  px-4
                  py-4
                "

              >

                <Text
                  className="
                    text-center
                    text-violet-700
                    font-bold
                  "
                >

                  🔐 VOOLER ADMIN

                </Text>

              </Pressable>


              {/* ADMIN INFORMATION */}

              <Text
                className="
                  text-xs
                  text-slate-400
                  text-center
                  mt-5
                  leading-5
                "
              >

                New farmers must be registered by an authorized VOOLER administrator.

              </Text>


            </CardContent>

          </Card>


          {/* =================================================
              FOOTER
          ================================================= */}

          <Text
            className="
              text-center
              text-xs
              text-slate-400
              mt-8
            "
          >

            VOOLER • Smart Cold Storage System

          </Text>


        </View>

      </ScrollView>

    </KeyboardAvoidingView>

  );

}