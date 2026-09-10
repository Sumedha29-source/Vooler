const express = require("express");

const Farmer = require("../models/Farmers");
const DeviceCommand = require("../models/DeviceCommands");

const router = express.Router();


// ========================================
// EMERGENCY SHUTDOWN
// POST /api/device-control/shutdown
// ========================================

router.post("/shutdown", async (req, res) => {
  try {
    const {
      phone,
      storageId,
    } = req.body;

    // Check required information
    if (!phone || !storageId) {
      return res.status(400).json({
        success: false,
        message:
          "Farmer phone number and storage ID are required",
      });
    }

    // Verify that this farmer actually owns
    // this storage unit
    const farmer = await Farmer.findOne({
      phone: phone.trim(),
      storageId: storageId.trim(),
    });

    if (!farmer) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to control this storage unit",
      });
    }

    // Create or update device command
    const command =
      await DeviceCommand.findOneAndUpdate(
        {
          storageId: storageId.trim(),
        },

        {
          emergencyShutdown: true,
          requestedBy: phone.trim(),
          requestedAt: new Date(),
        },

        {
          new: true,
          upsert: true,
        }
      );

    res.json({
      success: true,
      message:
        "Emergency shutdown activated",

      command,
    });
  } catch (error) {
    console.error(
      "Emergency shutdown error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ========================================
// RESUME DEVICE
// POST /api/device-control/resume
// ========================================

router.post("/resume", async (req, res) => {
  try {
    const {
      phone,
      storageId,
    } = req.body;

    if (!phone || !storageId) {
      return res.status(400).json({
        success: false,
        message:
          "Farmer phone number and storage ID are required",
      });
    }

    // Verify farmer owns storage unit
    const farmer = await Farmer.findOne({
      phone: phone.trim(),
      storageId: storageId.trim(),
    });

    if (!farmer) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to control this storage unit",
      });
    }

    const command =
      await DeviceCommand.findOneAndUpdate(
        {
          storageId: storageId.trim(),
        },

        {
          emergencyShutdown: false,
          requestedBy: phone.trim(),
          requestedAt: new Date(),
        },

        {
          new: true,
          upsert: true,
        }
      );

    res.json({
      success: true,
      message:
        "Storage system resumed",

      command,
    });
  } catch (error) {
    console.error(
      "Resume system error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ========================================
// ESP32 / DASHBOARD CHECK COMMAND
// GET /api/device-control/:storageId
// ========================================

router.get("/:storageId", async (req, res) => {
  try {
    const storageId =
      req.params.storageId;

    let command =
      await DeviceCommand.findOne({
        storageId,
      });

    // If no command exists yet,
    // default to normal operation
    if (!command) {
      command =
        await DeviceCommand.create({
          storageId,
          emergencyShutdown: false,
        });
    }

    res.json({
      success: true,

      storageId:
        command.storageId,

      emergencyShutdown:
        command.emergencyShutdown,

      requestedBy:
        command.requestedBy,

      requestedAt:
        command.requestedAt,
    });
  } catch (error) {
    console.error(
      "Device command fetch error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


module.exports = router;
