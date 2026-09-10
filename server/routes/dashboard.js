const express = require("express");
const Farmer = require("../models/Farmers");
const Reading = require("../models/Readings");


const router = express.Router();

// ========================================
// GET DASHBOARD DATA
// ========================================

router.get("/:storageId", async (req, res) => {
  try {
    const { storageId } = req.params;

    const farmer = await Farmer.findOne({
      storageId,
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Storage unit not found",
      });
    }

    // Latest reading
    const latestReading = await Reading.findOne({
      storageId,
    }).sort({
      createdAt: -1,
    });

    // Last 20 readings
    const readings = await Reading.find({
      storageId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(20)
      .lean();

    // Reverse so graph goes oldest -> newest
    readings.reverse();

    // Device is considered offline if no data
    // received for more than 2 minutes
    let online = false;

    if (latestReading) {
      const lastSeen = new Date(
        latestReading.createdAt
      ).getTime();

      const currentTime = Date.now();

      const difference = currentTime - lastSeen;

      online = difference <= 2 * 60 * 1000;
    }

    res.status(200).json({
      success: true,

      farmer: {
        name: farmer.name,
        phone: farmer.phone,
        storageId: farmer.storageId,
        language: farmer.language,
      },

      latest: latestReading
        ? {
            temperature:
              latestReading.temperature,

            humidity:
              latestReading.humidity,

            power:
              latestReading.power,

            online,

            timestamp:
              latestReading.createdAt,
          }
        : null,

      history: readings.map((reading) => ({
        temperature: reading.temperature,
        humidity: reading.humidity,
        power: reading.power,
        timestamp: reading.createdAt,
      })),
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;