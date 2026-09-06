const express = require("express");
const Farmer = require("../models/Farmers");
const Reading = require("../models/Readings");

const router = express.Router();

// ========================================
// RECEIVE DATA FROM ESP32 + SIM800L
// ========================================

router.post("/data", async (req, res) => {
  try {
    const {
      storageId,
      deviceKey,
      temperature,
      humidity,
      power,
    } = req.body;

    // Check required fields
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

    // Check if this is a registered VOOLER device
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

    // Validate sensor values
    const tempValue = Number(temperature);
    const humidityValue = Number(humidity);

    if (
      !Number.isFinite(tempValue) ||
      !Number.isFinite(humidityValue)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sensor values",
      });
    }

    if (humidityValue < 0 || humidityValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Humidity must be between 0 and 100",
      });
    }

    // Save reading
    const reading = await Reading.create({
      storageId: farmer.storageId,
      temperature: tempValue,
      humidity: humidityValue,
      power: Boolean(power),
      online: true,
    });

    res.status(201).json({
      success: true,
      message: "Sensor data stored successfully",
      reading: {
        storageId: reading.storageId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        power: reading.power,
        time: reading.createdAt,
      },
    });
  } catch (error) {
    console.error("Device data error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;