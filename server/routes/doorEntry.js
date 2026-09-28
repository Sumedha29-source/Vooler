const express = require("express");

const Farmer = require("../models/Farmers");
const EntryLog = require("../models/EntryLog");

const router = express.Router();


// =====================================================
// POST /api/device/door-entry
//
// Receives a door-entry timestamp from the VOOLER
// device or the temporary website test page.
//
// Expected JSON:
//
// {
//   "storageId": "CS001",
//   "deviceKey": "...",
//   "timestamp": "2026-09-28T10:30:00.000Z"
// }
// =====================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const {
        storageId,
        deviceKey,
        timestamp,
      } = req.body;


      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !storageId ||
        !deviceKey ||
        !timestamp
      ) {
        return res.status(400).json({
          success: false,
          message:
            "storageId, deviceKey and timestamp are required",
        });
      }


      // =================================================
      // VERIFY DEVICE
      // =================================================
      //
      // Multiple farmers can belong to the same storage,
      // so we only need to confirm that this storageId /
      // deviceKey combination exists.
      // =================================================

      const validDevice =
        await Farmer.findOne({
          storageId,
          deviceKey,
        }).select("_id");


      if (!validDevice) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid storage ID or device key",
        });
      }


      // =================================================
      // VALIDATE TIMESTAMP
      // =================================================

      const parsedTimestamp =
        new Date(timestamp);


      if (
        Number.isNaN(
          parsedTimestamp.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid timestamp",
        });
      }


      // =================================================
      // CREATE ENTRY LOG
      // =================================================

      const entryLog =
        await EntryLog.create({
          storageId,
          timestamp:
            parsedTimestamp,
          eventType:
            "DOOR_ENTRY",
        });


      console.log(
        "VOOLER DOOR ENTRY:",
        storageId,
        entryLog.timestamp
      );


      // =================================================
      // RESPONSE
      // =================================================

      return res.status(201).json({
        success: true,
        message:
          "Door entry recorded successfully",

        entry: {
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
        "Door entry error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to record door entry",
      });
    }
  }
);


module.exports = router;