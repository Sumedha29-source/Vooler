const express = require("express");

const Farmer = require("../models/Farmers");
const Reading = require("../models/Readings");

const router = express.Router();


// =====================================================
// RECEIVE DATA FROM ESP32
// =====================================================

router.post(
  "/data",
  async (req, res) => {

    try {

      const {
        storageId,
        deviceKey,

        // Current temperatures from DS18B20
        chamber1Temperature,
        chamber2Temperature,

        // Set temperatures selected on OLED
        chamber1SetTemperature,
        chamber2SetTemperature,

        humidity,
        power,
      } = req.body;


      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !storageId ||
        !deviceKey ||
        chamber1Temperature === undefined ||
        chamber2Temperature === undefined ||
        chamber1SetTemperature === undefined ||
        chamber2SetTemperature === undefined ||
        humidity === undefined ||
        power === undefined
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "storageId, deviceKey, current temperatures, set temperatures, humidity and power are required",
          });

      }


      // =================================================
      // CLEAN STORAGE ID + DEVICE KEY
      // =================================================

      const cleanStorageId =
        String(
          storageId
        ).trim();


      const cleanDeviceKey =
        String(
          deviceKey
        ).trim();


      // =================================================
      // VERIFY DEVICE
      // =================================================

      const farmer =
        await Farmer.findOne({
          storageId:
            cleanStorageId,

          deviceKey:
            cleanDeviceKey,
        });


      if (!farmer) {

        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid storage ID or device key",
          });

      }


      // =================================================
      // CONVERT TEMPERATURE + HUMIDITY VALUES
      // =================================================

      const chamber1Value =
        Number(
          chamber1Temperature
        );


      const chamber2Value =
        Number(
          chamber2Temperature
        );


      const chamber1SetValue =
        Number(
          chamber1SetTemperature
        );


      const chamber2SetValue =
        Number(
          chamber2SetTemperature
        );


      const humidityValue =
        Number(
          humidity
        );


      // =================================================
      // CURRENT TEMPERATURE VALIDATION
      // =================================================

      if (
        !Number.isFinite(
          chamber1Value
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid Chamber 1 current temperature",
          });

      }


      if (
        !Number.isFinite(
          chamber2Value
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid Chamber 2 current temperature",
          });

      }


      // =================================================
      // SET TEMPERATURE VALIDATION
      // =================================================

      if (
        !Number.isFinite(
          chamber1SetValue
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid Chamber 1 set temperature",
          });

      }


      if (
        !Number.isFinite(
          chamber2SetValue
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid Chamber 2 set temperature",
          });

      }


      // =================================================
      // SAFE SET-TEMPERATURE RANGE
      // =================================================

      if (
        chamber1SetValue < 0 ||
        chamber1SetValue > 40
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Chamber 1 set temperature must be between 0°C and 40°C",
          });

      }


      if (
        chamber2SetValue < 0 ||
        chamber2SetValue > 40
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Chamber 2 set temperature must be between 0°C and 40°C",
          });

      }


      // =================================================
      // HUMIDITY VALIDATION
      // =================================================

      if (
        !Number.isFinite(
          humidityValue
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid humidity value",
          });

      }


      if (
        humidityValue < 0 ||
        humidityValue > 100
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Humidity must be between 0 and 100",
          });

      }


      // =================================================
      // POWER VALUE
      // =================================================

      let powerValue;


      if (
        typeof power ===
        "boolean"
      ) {

        powerValue =
          power;

      }
      else if (
        power === 1 ||
        power === "1" ||
        power === "true"
      ) {

        powerValue =
          true;

      }
      else if (
        power === 0 ||
        power === "0" ||
        power === "false"
      ) {

        powerValue =
          false;

      }
      else {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Invalid power value",
          });

      }


      // =================================================
      // CREATE READING
      // =================================================

      const reading =
        await Reading.create({

          storageId:
            farmer.storageId,

          // Current temperatures
          chamber1Temperature:
            chamber1Value,

          chamber2Temperature:
            chamber2Value,

          // OLED set temperatures
          chamber1SetTemperature:
            chamber1SetValue,

          chamber2SetTemperature:
            chamber2SetValue,

          humidity:
            humidityValue,

          power:
            powerValue,

          online:
            true,

        });


      console.log(
        "New VOOLER reading:",
        {
          storageId:
            farmer.storageId,

          chamber1Temperature:
            chamber1Value,

          chamber1SetTemperature:
            chamber1SetValue,

          chamber2Temperature:
            chamber2Value,

          chamber2SetTemperature:
            chamber2SetValue,

          humidity:
            humidityValue,

          power:
            powerValue,
        }
      );


      // =================================================
      // SUCCESS
      // =================================================

      return res
        .status(201)
        .json({
          success: true,

          message:
            "VOOLER data stored successfully",

          reading: {

            id:
              reading._id,

            storageId:
              reading.storageId,

            chamber1Temperature:
              reading.chamber1Temperature,

            chamber1SetTemperature:
              reading.chamber1SetTemperature,

            chamber2Temperature:
              reading.chamber2Temperature,

            chamber2SetTemperature:
              reading.chamber2SetTemperature,

            humidity:
              reading.humidity,

            power:
              reading.power,

            online:
              reading.online,

            timestamp:
              reading.createdAt,

          },
        });

    }
    catch (error) {

      console.error(
        "Device data error:"
      );

      console.error(
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while saving VOOLER data",
        });

    }

  }
);


module.exports = router;