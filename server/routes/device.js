const express = require("express");
const mongoose = require("mongoose");

const Farmer = require("../models/Farmers");
const Reading = require("../models/Readings");

const router = express.Router();

// ========================================
// RECEIVE DATA FROM ESP32
// ========================================

router.post("/data", async (req, res) => {
  try {
    const {
      storageId,
      deviceKey,
      temperature,
      humidity,
      power,
      battery,
      peltiersOn,
    } = req.body;

    // ========================================
    // CHECK REQUIRED FIELDS
    // ========================================

    if (
      !storageId ||
      !deviceKey ||
      temperature === undefined ||
      humidity === undefined ||
      power === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required data",
      });
    }

    // ========================================
    // VERIFY REGISTERED VOOLER DEVICE
    // ========================================

    const farmer = await Farmer.findOne({
      storageId: storageId.trim(),
      deviceKey: deviceKey.trim(),
    });

    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: "Invalid storage unit or device key",
      });
    }

    // ========================================
    // CONVERT SENSOR VALUES
    // ========================================

    const tempValue =
      Number(temperature);

    const humidityValue =
      Number(humidity);

    // ========================================
    // VALIDATE TEMPERATURE + HUMIDITY
    // ========================================

    if (
      !Number.isFinite(tempValue) ||
      !Number.isFinite(humidityValue)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sensor values",
      });
    }

    if (
      humidityValue < 0 ||
      humidityValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Humidity must be between 0 and 100",
      });
    }

    // ========================================
    // BATTERY
    // ========================================

    let batteryValue = 100;

    if (
      battery !== undefined
    ) {
      batteryValue =
        Number(battery);

      if (
        !Number.isFinite(
          batteryValue
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid battery value",
        });
      }

      if (
        batteryValue < 0 ||
        batteryValue > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Battery must be between 0 and 100",
        });
      }
    }

    // ========================================
    // SAVE READING TO MONGODB
    // ========================================

    const reading =
      await Reading.create({
        storageId:
          farmer.storageId,

        temperature:
          tempValue,

        humidity:
          humidityValue,

        power:
          Boolean(power),

        online:
          true,

        battery:
          batteryValue,

        peltiersOn:
          peltiersOn !== undefined
            ? Boolean(peltiersOn)
            : false,
      });

    // ========================================
    // DEBUG LOGS
    // ========================================

    console.log(
      "===== READING SAVED ====="
    );

    console.log(
      "ID:",
      reading._id.toString()
    );

    console.log(
      "Database:",
      mongoose.connection.name
    );

    console.log(
      "Host:",
      mongoose.connection.host
    );

    console.log(
      "Collection:",
      Reading.collection.name
    );

    console.log(
      "Storage ID:",
      reading.storageId
    );

    console.log(
      "Temperature:",
      reading.temperature
    );

    console.log(
      "Humidity:",
      reading.humidity
    );

    console.log(
      "Power:",
      reading.power
    );

    console.log(
      "Battery:",
      reading.battery
    );

    console.log(
      "Peltiers ON:",
      reading.peltiersOn
    );

    console.log(
      "Created:",
      reading.createdAt
    );

    console.log(
      "========================="
    );

    // ========================================
    // RESPONSE TO ESP32
    // ========================================

    return res
      .status(201)
      .json({
        success: true,

        message:
          "Sensor data stored successfully",

        reading: {
          id:
            reading._id,

          storageId:
            reading.storageId,

          temperature:
            reading.temperature,

          humidity:
            reading.humidity,

          power:
            reading.power,

          online:
            reading.online,

          battery:
            reading.battery,

          peltiersOn:
            reading.peltiersOn,

          time:
            reading.createdAt,
        },
      });

  } catch (error) {

    console.error(
      "Device data error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message: "Server error",
      });
  }
});

module.exports = router;