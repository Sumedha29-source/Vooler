const express = require("express");

const Farmer = require("../models/Farmers");
const EntryLog = require("../models/EntryLog");

const router = express.Router();


// =====================================================
// DOOR ENTRY / EXIT EVENT
//
// POST /api/device/door-entry
//
// Receives:
// - storageId
// - deviceKey
// - type: "entry" or "exit"
// - timestamp
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      storageId,
      deviceKey,
      type,
      timestamp,
    } = req.body;


    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !storageId ||
      !deviceKey ||
      !type ||
      !timestamp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "storageId, deviceKey, type and timestamp are required",
      });
    }


    // =================================================
    // VALIDATE EVENT TYPE
    // =================================================

    const cleanType =
      String(type)
        .trim()
        .toLowerCase();

    if (
      cleanType !== "entry" &&
      cleanType !== "exit"
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Event type must be "entry" or "exit"',
      });
    }


    // =================================================
    // VERIFY DEVICE
    // =================================================

    const farmer =
      await Farmer.findOne({
        storageId:
          String(storageId).trim(),

        deviceKey:
          String(deviceKey).trim(),
      }).select("_id");


    if (!farmer) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid storage ID or device key",
      });
    }


    // =================================================
    // VALIDATE TIMESTAMP
    // =================================================

    const eventTimestamp =
      new Date(timestamp);

    if (
      Number.isNaN(
        eventTimestamp.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid timestamp",
      });
    }


    // =================================================
    // CONVERT HTML EVENT TYPE TO DATABASE EVENT TYPE
    // =================================================

    const eventType =
      cleanType === "exit"
        ? "DOOR_CLOSED"
        : "DOOR_ENTRY";


    // =================================================
    // CREATE ENTRY LOG
    // =================================================

    const entryLog =
      await EntryLog.create({
        storageId:
          String(storageId).trim(),

        timestamp:
          eventTimestamp,

        eventType,
      });


    // =================================================
    // SERVER LOG
    // =================================================

    console.log(
      `VOOLER DOOR EVENT: ${eventType}`,
      storageId,
      eventTimestamp.toISOString()
    );


    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        cleanType === "exit"
          ? "Door exit recorded successfully"
          : "Door entry recorded successfully",

      event: {
        id:
          entryLog._id,

        storageId:
          entryLog.storageId,

        eventType:
          entryLog.eventType,

        timestamp:
          entryLog.timestamp,

        createdAt:
          entryLog.createdAt,
      },
    });
  }
  catch (error) {
    console.error(
      "Door event error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to record door event",
    });
  }
});


module.exports = router;