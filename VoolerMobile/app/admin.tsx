import {
  useState,
} from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  View,
} from "react-native";

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
  Input,
} from "@/components/ui/input";

import {
  Text,
} from "@/components/ui/text";


// =====================================================
// BACKEND
// =====================================================

const API_BASE_URL =
  "https://vooler.onrender.com";


// =====================================================
// ADMIN PAGE
// =====================================================

export default function AdminScreen() {

  // ===================================================
  // ADMIN AUTH
  // ===================================================

  const [
    adminKey,
    setAdminKey,
  ] =
    useState("");


  const [
    adminVerified,
    setAdminVerified,
  ] =
    useState(false);


  const [
    verifying,
    setVerifying,
  ] =
    useState(false);


  // ===================================================
  // FARMER REGISTRATION FORM
  // ===================================================

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
    simNumber,
    setSimNumber,
  ] =
    useState("");


  const [
    language,
    setLanguage,
  ] =
    useState("en");


  const [
    registering,
    setRegistering,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  // ===================================================
  // VERIFY ADMIN
  // ===================================================

  const verifyAdmin =
    async () => {

      if (
        !adminKey.trim()
      ) {

        setError(
          "Please enter the admin key."
        );

        return;

      }


      try {

        setVerifying(
          true
        );

        setError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/verify`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "x-admin-key":
                  adminKey.trim(),
              },
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Admin verification failed."
          );

        }


        setAdminVerified(
          true
        );


        Alert.alert(
          "Admin Verified",
          "You can now register a new farmer."
        );

      }
      catch (err: any) {

        console.log(
          "ADMIN VERIFY ERROR:",
          err
        );


        setAdminVerified(
          false
        );


        setError(
          err?.message ||
          "Unable to verify admin key."
        );

      }
      finally {

        setVerifying(
          false
        );

      }

    };


  // ===================================================
  // REGISTER FARMER
  // ===================================================

  const registerFarmer =
    async () => {

      if (
        !adminVerified
      ) {

        setError(
          "Admin verification is required."
        );

        return;

      }


      if (
        !name.trim() ||
        !phone.trim() ||
        !simNumber.trim()
      ) {

        setError(
          "Name, phone number and SIM number are required."
        );

        return;

      }


      if (
        !/^\d{10}$/.test(
          phone.trim()
        )
      ) {

        setError(
          "Farmer mobile number must contain exactly 10 digits."
        );

        return;

      }


      if (
        !/^\d{10}$/.test(
          simNumber.trim()
        )
      ) {

        setError(
          "SIM number must contain exactly 10 digits."
        );

        return;

      }


      try {

        setRegistering(
          true
        );

        setError("");


        const response =
          await fetch(
            `${API_BASE_URL}/api/admin/register`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "x-admin-key":
                  adminKey.trim(),
              },

              body:
                JSON.stringify({
                  name:
                    name.trim(),

                  phone:
                    phone.trim(),

                  simNumber:
                    simNumber.trim(),

                  language,
                }),
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Farmer registration failed."
          );

        }


        Alert.alert(
          "Registration Successful",
          `${data.message}\n\nStorage ID: ${
            data.farmer?.storageId ||
            "CS001"
          }`,
          [
            {
              text:
                "Register Another",

              onPress:
                () => {

                  setName("");
                  setPhone("");
                  setSimNumber("");
                  setLanguage(
                    "en"
                  );

                },
            },

            {
              text:
                "Back to Login",

              onPress:
                () =>
                  router.replace(
                    "/"
                  ),
            },
          ]
        );

      }
      catch (err: any) {

        console.log(
          "REGISTER FARMER ERROR:",
          err
        );


        setError(
          err?.message ||
          "Unable to register farmer."
        );

      }
      finally {

        setRegistering(
          false
        );

      }

    };


  // ===================================================
  // UI
  // ===================================================

  return (

    <ScrollView

      className="
        flex-1
        bg-background
      "

      contentContainerClassName="
        px-5
        pt-14
        pb-20
      "

      keyboardShouldPersistTaps="handled"

    >


      {/* =================================================
          HEADER
      ================================================= */}

      <Text
        className="
          text-3xl
          font-bold
        "
      >
        ❄ VOOLER
      </Text>


      <Text
        className="
          text-xl
          font-semibold
          mt-2
        "
      >

        Admin Registration

      </Text>


      <Text
        className="
          text-muted-foreground
          mt-1
          mb-6
        "
      >

        Register farmers with
        authorized VOOLER admin access.

      </Text>


      {/* =================================================
          ERROR
      ================================================= */}

      {error ? (

        <Card
          className="
            mb-4
            border-destructive
          "
        >

          <CardContent
            className="
              pt-5
            "
          >

            <Text
              className="
                text-destructive
                font-medium
              "
            >

              ⚠ {error}

            </Text>

          </CardContent>

        </Card>

      ) : null}


      {/* =================================================
          ADMIN VERIFICATION
      ================================================= */}

      <Card
        className="mb-5"
      >

        <CardHeader>

          <CardDescription>
            ADMIN ACCESS
          </CardDescription>


          <CardTitle>
            Verify Admin Key
          </CardTitle>

        </CardHeader>


        <CardContent>


          <Text
            className="
              text-sm
              text-muted-foreground
              mb-2
            "
          >

            Admin Key

          </Text>


          <Input

            value={
              adminKey
            }

            onChangeText={
              setAdminKey
            }

            placeholder="
              Enter admin key
            "

            secureTextEntry={
              true
            }

            editable={
              !adminVerified
            }

            className="
              mb-4
            "

          />


          {!adminVerified ? (

            <Pressable

              disabled={
                verifying
              }

              onPress={
                verifyAdmin
              }

              className="
                rounded-xl
                bg-primary
                px-4
                py-4
              "

              style={{
                opacity:
                  verifying
                    ? 0.6
                    : 1,
              }}

            >

              <Text
                className="
                  text-center
                  text-primary-foreground
                  font-bold
                "
              >

                {verifying
                  ? "VERIFYING..."
                  : "VERIFY ADMIN"}

              </Text>

            </Pressable>

          ) : (

            <View
              className="
                rounded-xl
                border
                border-emerald-500
                bg-emerald-50
                px-4
                py-4
              "
            >

              <Text
                className="
                  text-center
                  text-emerald-700
                  font-bold
                "
              >

                ✓ ADMIN VERIFIED

              </Text>

            </View>

          )}


        </CardContent>

      </Card>


      {/* =================================================
          FARMER FORM
      ================================================= */}

      {adminVerified ? (

        <Card
          className="mb-5"
        >

          <CardHeader>

            <CardDescription>
              NEW FARMER
            </CardDescription>


            <CardTitle>
              Farmer Registration
            </CardTitle>

          </CardHeader>


          <CardContent>


            {/* NAME */}

            <Text
              className="
                text-sm
                font-semibold
                mb-2
              "
            >
              Farmer Name
            </Text>


            <Input

              value={
                name
              }

              onChangeText={
                setName
              }

              placeholder="
                Enter farmer name
              "

              autoCapitalize="words"

              className="
                mb-4
              "

            />


            {/* PHONE */}

            <Text
              className="
                text-sm
                font-semibold
                mb-2
              "
            >
              Farmer Mobile Number
            </Text>


            <Input

              value={
                phone
              }

              onChangeText={
                (
                  value
                ) =>
                  setPhone(
                    value.replace(
                      /\D/g,
                      ""
                    ).slice(
                      0,
                      10
                    )
                  )
              }

              placeholder="
                10-digit mobile number
              "

              keyboardType="phone-pad"

              maxLength={
                10
              }

              className="
                mb-4
              "

            />


            {/* SIM */}

            <Text
              className="
                text-sm
                font-semibold
                mb-2
              "
            >
              Storage SIM Number
            </Text>


            <Input

              value={
                simNumber
              }

              onChangeText={
                (
                  value
                ) =>
                  setSimNumber(
                    value.replace(
                      /\D/g,
                      ""
                    ).slice(
                      0,
                      10
                    )
                  )
              }

              placeholder="
                10-digit SIM number
              "

              keyboardType="phone-pad"

              maxLength={
                10
              }

              className="
                mb-5
              "

            />


            {/* LANGUAGE */}

            <Text
              className="
                text-sm
                font-semibold
                mb-3
              "
            >
              Preferred Language
            </Text>


            <View
              className="
                flex-row
                flex-wrap
                gap-2
                mb-6
              "
            >


              {[
                {
                  code:
                    "en",

                  label:
                    "English",
                },

                {
                  code:
                    "bn",

                  label:
                    "বাংলা",
                },

                {
                  code:
                    "hi",

                  label:
                    "हिन्दी",
                },

                {
                  code:
                    "as",

                  label:
                    "অসমীয়া",
                },
              ].map(
                (
                  option
                ) => (

                  <Pressable

                    key={
                      option.code
                    }

                    onPress={
                      () =>
                        setLanguage(
                          option.code
                        )
                    }

                    className={`
                      rounded-xl
                      border
                      px-4
                      py-3

                      ${
                        language ===
                        option.code

                          ? "bg-primary border-primary"

                          : "bg-background border-border"
                      }
                    `}

                  >

                    <Text

                      className={
                        language ===
                        option.code

                          ? "text-primary-foreground font-semibold"

                          : "font-semibold"
                      }

                    >

                      {option.label}

                    </Text>

                  </Pressable>

                )
              )}

            </View>


            {/* REGISTER */}

            <Pressable

              disabled={
                registering
              }

              onPress={
                registerFarmer
              }

              className="
                rounded-xl
                bg-primary
                px-4
                py-4
              "

              style={{
                opacity:
                  registering
                    ? 0.6
                    : 1,
              }}

            >

              <Text
                className="
                  text-center
                  text-primary-foreground
                  font-bold
                "
              >

                {registering
                  ? "REGISTERING..."
                  : "REGISTER FARMER"}

              </Text>

            </Pressable>


          </CardContent>

        </Card>

      ) : null}


      {/* =================================================
          BACK
      ================================================= */}

      <Pressable

        onPress={
          () =>
            router.replace(
              "/"
            )
        }

        className="
          rounded-xl
          border
          border-border
          px-4
          py-4
        "

      >

        <Text
          className="
            text-center
            font-semibold
          "
        >

          ← Back to Farmer Login

        </Text>

      </Pressable>


    </ScrollView>

  );

}