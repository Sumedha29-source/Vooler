const express = require("express");

const Farmer = require("../models/Farmers");
const DeviceCommand = require("../models/DeviceCommands");

const router = express.Router();


// =====================================================
// HELPER
// FIND / CREATE DEVICE COMMAND DOCUMENT
// =====================================================

const getOrCreateCommand =
  async (storageId) => {

    let command =
      await DeviceCommand.findOne({
        storageId,
      });


    if (!command) {

      command =
        await DeviceCommand.create({
          storageId,

          emergencyShutdown:
            false,

          chamber1SetTemperature:
            18,

          chamber2SetTemperature:
            18,
        });

    }


    return command;

  };


// =====================================================
// EMERGENCY SHUTDOWN
// =====================================================

router.post(
  "/shutdown",
  async (req, res) => {

    try {

      const {
        phone,
        storageId,
      } = req.body;


      // ===============================================
      // VALIDATION
      // ===============================================

      if (
        !phone ||
        !storageId
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Phone number and storage ID are required",
          });

      }


      const cleanPhone =
        String(
          phone
        ).trim();


      const cleanStorageId =
        String(
          storageId
        ).trim();


      // ===============================================
      // VERIFY FARMER
      // ===============================================

      const farmer =
        await Farmer.findOne({
          phone:
            cleanPhone,

          storageId:
            cleanStorageId,
        });


      if (!farmer) {

        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid farmer or storage ID",
          });

      }


      // ===============================================
      // UPDATE COMMAND
      // ===============================================

      const command =
        await DeviceCommand.findOneAndUpdate(
          {
            storageId:
              cleanStorageId,
          },

          {
            $set: {
              emergencyShutdown:
                true,

              requestedBy:
                cleanPhone,

              requestedAt:
                new Date(),
            },

            $setOnInsert: {
              chamber1SetTemperature:
                18,

              chamber2SetTemperature:
                18,
            },
          },

          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );


      // ===============================================
      // SUCCESS
      // ===============================================

      return res.json({
        success: true,

        message:
          "Emergency shutdown activated",

        storageId:
          command.storageId,

        emergencyShutdown:
          command.emergencyShutdown,

        chamber1SetTemperature:
          command.chamber1SetTemperature,

        chamber2SetTemperature:
          command.chamber2SetTemperature,

        requestedAt:
          command.requestedAt,
      });

    }
    catch (error) {

      console.error(
        "Emergency shutdown error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while activating emergency shutdown",
        });

    }

  }
);


// =====================================================
// RESUME SYSTEM
// =====================================================

router.post(
  "/resume",
  async (req, res) => {

    try {

      const {
        phone,
        storageId,
      } = req.body;


      // ===============================================
      // VALIDATION
      // ===============================================

      if (
        !phone ||
        !storageId
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Phone number and storage ID are required",
          });

      }


      const cleanPhone =
        String(
          phone
        ).trim();


      const cleanStorageId =
        String(
          storageId
        ).trim();


      // ===============================================
      // VERIFY FARMER
      // ===============================================

      const farmer =
        await Farmer.findOne({
          phone:
            cleanPhone,

          storageId:
            cleanStorageId,
        });


      if (!farmer) {

        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid farmer or storage ID",
          });

      }


      // ===============================================
      // UPDATE COMMAND
      // ===============================================

      const command =
        await DeviceCommand.findOneAndUpdate(
          {
            storageId:
              cleanStorageId,
          },

          {
            $set: {
              emergencyShutdown:
                false,

              requestedBy:
                cleanPhone,

              requestedAt:
                new Date(),
            },

            $setOnInsert: {
              chamber1SetTemperature:
                18,

              chamber2SetTemperature:
                18,
            },
          },

          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );


      // ===============================================
      // SUCCESS
      // ===============================================

      return res.json({
        success: true,

        message:
          "VOOLER system resumed",

        storageId:
          command.storageId,

        emergencyShutdown:
          command.emergencyShutdown,

        chamber1SetTemperature:
          command.chamber1SetTemperature,

        chamber2SetTemperature:
          command.chamber2SetTemperature,

        requestedAt:
          command.requestedAt,
      });

    }
    catch (error) {

      console.error(
        "Resume system error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while resuming system",
        });

    }

  }
);


// =====================================================
// SET CHAMBER TEMPERATURES
// =====================================================

router.post(
  "/set-temperature",
  async (req, res) => {

    try {

      const {
        phone,
        storageId,
        chamber1SetTemperature,
        chamber2SetTemperature,
      } = req.body;


      // ===============================================
      // REQUIRED FIELDS
      // ===============================================

      if (
        !phone ||
        !storageId ||
        chamber1SetTemperature === undefined ||
        chamber2SetTemperature === undefined
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Phone number, storage ID and both set temperatures are required",
          });

      }


      const cleanPhone =
        String(
          phone
        ).trim();


      const cleanStorageId =
        String(
          storageId
        ).trim();


      // ===============================================
      // CONVERT VALUES
      // ===============================================

      const chamber1Value =
        Number(
          chamber1SetTemperature
        );


      const chamber2Value =
        Number(
          chamber2SetTemperature
        );


      // ===============================================
      // VALIDATE TEMPERATURES
      // ===============================================

      if (
        !Number.isFinite(
          chamber1Value
        ) ||
        !Number.isFinite(
          chamber2Value
        )
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Set temperatures must be valid numbers",
          });

      }


      // ===============================================
      // SAFE RANGE
      //
      // You can change this later if your prototype
      // needs another control range.
      // ===============================================

      if (
        chamber1Value < 0 ||
        chamber1Value > 40
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
        chamber2Value < 0 ||
        chamber2Value > 40
      ) {

        return res
          .status(400)
          .json({
            success: false,

            message:
              "Chamber 2 set temperature must be between 0°C and 40°C",
          });

      }


      // ===============================================
      // VERIFY FARMER
      // ===============================================

      const farmer =
        await Farmer.findOne({
          phone:
            cleanPhone,

          storageId:
            cleanStorageId,
        });


      if (!farmer) {

        return res
          .status(401)
          .json({
            success: false,

            message:
              "Invalid farmer or storage ID",
          });

      }


      // ===============================================
      // UPDATE SET TEMPERATURES
      // ===============================================

      const command =
        await DeviceCommand.findOneAndUpdate(
          {
            storageId:
              cleanStorageId,
          },

          {
            $set: {
              chamber1SetTemperature:
                chamber1Value,

              chamber2SetTemperature:
                chamber2Value,

              requestedBy:
                cleanPhone,

              requestedAt:
                new Date(),
            },

            $setOnInsert: {
              emergencyShutdown:
                false,
            },
          },

          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          }
        );


      console.log(
        "Set temperatures updated:",
        {
          storageId:
            cleanStorageId,

          chamber1SetTemperature:
            chamber1Value,

          chamber2SetTemperature:
            chamber2Value,
        }
      );


      // ===============================================
      // SUCCESS
      // ===============================================

      return res.json({
        success: true,

        message:
          "Set temperatures updated successfully",

        storageId:
          command.storageId,

        chamber1SetTemperature:
          command.chamber1SetTemperature,

        chamber2SetTemperature:
          command.chamber2SetTemperature,

        emergencyShutdown:
          command.emergencyShutdown,

        requestedAt:
          command.requestedAt,
      });

    }
    catch (error) {

      console.error(
        "Set temperature error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while updating set temperatures",
        });

    }

  }
);


// =====================================================
// GET DEVICE CONTROL STATE
//
// Website, app and ESP32 can read this.
// =====================================================

router.get(
  "/:storageId",
  async (req, res) => {

    try {

      const cleanStorageId =
        String(
          req.params.storageId
        ).trim();


      // ===============================================
      // VERIFY STORAGE EXISTS
      // ===============================================

      const farmer =
        await Farmer.findOne({
          storageId:
            cleanStorageId,
        });


      if (!farmer) {

        return res
          .status(404)
          .json({
            success: false,

            message:
              "Storage ID not found",
          });

      }


      // ===============================================
      // GET / CREATE COMMAND
      // ===============================================

      const command =
        await getOrCreateCommand(
          cleanStorageId
        );


      // ===============================================
      // RETURN CONTROL STATE
      // ===============================================

      return res.json({
        success: true,

        storageId:
          command.storageId,

        emergencyShutdown:
          command.emergencyShutdown,

        chamber1SetTemperature:
          command.chamber1SetTemperature,

        chamber2SetTemperature:
          command.chamber2SetTemperature,

        requestedBy:
          command.requestedBy,

        requestedAt:
          command.requestedAt,

        updatedAt:
          command.updatedAt,
      });

    }
    catch (error) {

      console.error(
        "Fetch device control error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,

          message:
            "Server error while fetching device control state",
        });

    }

  }
);


module.exports = router;