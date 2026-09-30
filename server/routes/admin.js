const express = require("express");

const Farmer = require("../models/Farmers");
const SmsCommand = require("../models/SmsCommands");
const EntryLog = require("../models/EntryLog");

const router = express.Router();


// =====================================================
// ADMIN AUTH MIDDLEWARE
// =====================================================

const verifyAdmin = (req, res, next) => {

  const adminKey =
    req.header("x-admin-key");


  if (!adminKey) {

    return res.status(401).json({
      success: false,
      message: "Admin key required",
    });

  }


  if (
    adminKey !==
    process.env.ADMIN_KEY
  ) {

    return res.status(401).json({
      success: false,
      message: "Invalid admin key",
    });

  }


  next();
};


// =====================================================
// VERIFY ADMIN KEY
// =====================================================

router.post(
  "/verify",
  verifyAdmin,
  (req, res) => {

    res.json({
      success: true,
      message:
        "Admin verified successfully",
    });

  }
);


// =====================================================
// REGISTER FARMER
// =====================================================

router.post(
  "/register",
  verifyAdmin,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        simNumber,
        language,
        devicePin,
      } = req.body;


      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !name ||
        !phone ||
        !simNumber ||
        !devicePin
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Name, phone number, SIM number and 4-digit device PIN are required",

          });

      }


      // =================================================
      // CLEAN VALUES
      // =================================================

      const cleanName =
        String(name).trim();

      const cleanPhone =
        String(phone).trim();

      const cleanSimNumber =
        String(simNumber).trim();

      const cleanLanguage =
        language || "en";

      const cleanDevicePin =
        String(devicePin).trim();


      // =================================================
      // PHONE VALIDATION
      // =================================================

      if (
        !/^\d{10}$/.test(
          cleanPhone
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Farmer mobile number must contain exactly 10 digits",

          });

      }


      // =================================================
      // SIM NUMBER VALIDATION
      // =================================================

      if (
        !/^\d{10}$/.test(
          cleanSimNumber
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "SIM number must contain exactly 10 digits",

          });

      }


      // =================================================
      // DEVICE PIN VALIDATION
      // =================================================

      if (
        !/^\d{4}$/.test(
          cleanDevicePin
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Device PIN must contain exactly 4 digits",

          });

      }


      // =================================================
      // LANGUAGE VALIDATION
      // =================================================

      const allowedLanguages = [
        "en",
        "bn",
        "hi",
        "as",
      ];


      if (
        !allowedLanguages.includes(
          cleanLanguage
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid language selected",

          });

      }


      // =================================================
      // CHECK WHETHER PHONE ALREADY EXISTS
      // =================================================

      const existingFarmer =
        await Farmer.findOne({
          phone: cleanPhone,
        });


      if (existingFarmer) {

        return res
          .status(409)
          .json({

            success: false,

            message:
              "This farmer mobile number is already registered",

          });

      }


      // =================================================
      // CREATE FARMER
      // =================================================

      const farmer =
        new Farmer({

          name:
            cleanName,

          phone:
            cleanPhone,

          simNumber:
            cleanSimNumber,

          language:
            cleanLanguage,

          devicePin:
            cleanDevicePin,

        });


      await farmer.save();


      console.log(
        "Farmer registered:",
        farmer.name,
        farmer.phone
      );


      // =================================================
      // CREATE WELCOME SMS COMMAND
      // =================================================

      let smsQueued =
        false;


      try {

        const welcomeMessage =
          `Welcome to VOOLER! ` +
          `Your registration is successful. ` +
          `Storage ID: ${farmer.storageId}. ` +
          `Send 1 to the VOOLER number anytime to receive the current storage status.`;


        await SmsCommand.create({

          phone:
            `+91${farmer.phone}`,

          storageId:
            farmer.storageId,

          message:
            welcomeMessage,

          status:
            "pending",

        });


        smsQueued =
          true;

      }
      catch (smsError) {

        console.error(
          "Unable to queue welcome SMS:",
          smsError.message
        );

      }


      // =================================================
      // SUCCESS
      // =================================================

      return res
        .status(201)
        .json({

          success: true,

          message:
            smsQueued
              ? "Farmer registered successfully. Welcome SMS queued."
              : "Farmer registered successfully, but welcome SMS could not be queued.",

          smsQueued,

          farmer: {

            id:
              farmer._id,

            _id:
              farmer._id,

            name:
              farmer.name,

            phone:
              farmer.phone,

            simNumber:
              farmer.simNumber,

            storageId:
              farmer.storageId,

            language:
              farmer.language,

            location:
              farmer.location,

            hasDevicePin:
              true,

          },

        });

    }
    catch (error) {

      console.error(
        "Farmer registration error:",
        error
      );


      if (
        error.code === 11000
      ) {

        return res
          .status(409)
          .json({

            success: false,

            message:
              "This farmer is already registered",

          });

      }


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Server error while registering farmer",

        });

    }

  }
);


// =====================================================
// GET ALL FARMERS
//
// devicePin is intentionally excluded because the
// Farmer model uses select: false for the PIN.
//
// Admin can retrieve it through the protected PIN route.
// =====================================================

router.get(
  "/farmers",
  verifyAdmin,
  async (req, res) => {

    try {

      const farmers =
        await Farmer
          .find()
          .sort({
            createdAt: -1,
          })
          .lean();


      return res.json({

        success: true,

        farmers,

      });

    }
    catch (error) {

      console.error(
        "Fetch farmers error:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to fetch farmers",

        });

    }

  }
);


// =====================================================
// EDIT FARMER DETAILS
//
// Admin only.
//
// Editable:
// - Name
// - Mobile number
// - SIM800L number
// - Preferred language
//
// NOT edited here:
// - Storage ID
// - Device PIN
// =====================================================

router.patch(
  "/farmers/:farmerId",
  verifyAdmin,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        simNumber,
        language,
      } = req.body;


      // =================================================
      // CLEAN VALUES
      // =================================================

      const cleanName =
        String(name || "").trim();

      const cleanPhone =
        String(phone || "").trim();

      const cleanSimNumber =
        String(simNumber || "").trim();

      const cleanLanguage =
        String(language || "").trim();


      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !cleanName ||
        !cleanPhone ||
        !cleanSimNumber ||
        !cleanLanguage
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Name, mobile number, SIM number and language are required",

          });

      }


      // =================================================
      // PHONE VALIDATION
      // =================================================

      if (
        !/^\d{10}$/.test(
          cleanPhone
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Farmer mobile number must contain exactly 10 digits",

          });

      }


      // =================================================
      // SIM NUMBER VALIDATION
      // =================================================

      if (
        !/^\d{10}$/.test(
          cleanSimNumber
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "SIM number must contain exactly 10 digits",

          });

      }


      // =================================================
      // LANGUAGE VALIDATION
      // =================================================

      const allowedLanguages = [
        "en",
        "bn",
        "hi",
        "as",
      ];


      if (
        !allowedLanguages.includes(
          cleanLanguage
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid language selected",

          });

      }


      // =================================================
      // CHECK IF ANOTHER FARMER HAS THIS PHONE NUMBER
      // =================================================

      const existingFarmer =
        await Farmer.findOne({

          phone:
            cleanPhone,

          _id: {
            $ne:
              req.params.farmerId,
          },

        });


      if (existingFarmer) {

        return res
          .status(409)
          .json({

            success: false,

            message:
              "This mobile number is already registered to another farmer",

          });

      }


      // =================================================
      // UPDATE FARMER
      // =================================================

      const farmer =
        await Farmer.findByIdAndUpdate(

          req.params.farmerId,

          {

            $set: {

              name:
                cleanName,

              phone:
                cleanPhone,

              simNumber:
                cleanSimNumber,

              language:
                cleanLanguage,

            },

          },

          {

            new: true,

            runValidators: true,

          }

        );


      // =================================================
      // FARMER NOT FOUND
      // =================================================

      if (!farmer) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Farmer not found",

          });

      }


      // =================================================
      // SUCCESS
      // =================================================

      return res.json({

        success: true,

        message:
          "Farmer details updated successfully",

        farmer: {

          id:
            farmer._id,

          _id:
            farmer._id,

          name:
            farmer.name,

          phone:
            farmer.phone,

          simNumber:
            farmer.simNumber,

          storageId:
            farmer.storageId,

          language:
            farmer.language,

          location:
            farmer.location,

          hasDevicePin:
            true,

        },

      });

    }
    catch (error) {

      console.error(
        "Edit farmer error:",
        error
      );


      // Invalid MongoDB ObjectId
      if (
        error.name ===
        "CastError"
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid farmer ID",

          });

      }


      // Duplicate value
      if (
        error.code === 11000
      ) {

        return res
          .status(409)
          .json({

            success: false,

            message:
              "This mobile number is already registered",

          });

      }


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to update farmer details",

        });

    }

  }
);


// =====================================================
// GET FARMER DEVICE PIN
//
// Admin only.
//
// devicePin has select: false in the Farmer model.
// We explicitly request it only for this protected route.
//
// Endpoint:
// GET /api/admin/farmers/:farmerId/device-pin
// =====================================================

router.get(
  "/farmers/:farmerId/device-pin",
  verifyAdmin,
  async (req, res) => {

    try {

      const farmer =
        await Farmer
          .findById(
            req.params.farmerId
          )
          .select("+devicePin");


      // =================================================
      // FARMER NOT FOUND
      // =================================================

      if (!farmer) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Farmer not found",

          });

      }


      // =================================================
      // PIN NOT CONFIGURED
      // =================================================

      if (!farmer.devicePin) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Device PIN is not configured for this farmer",

          });

      }


      // =================================================
      // SUCCESS
      // =================================================

      return res.json({

        success: true,

        devicePin:
          farmer.devicePin,

      });

    }
    catch (error) {

      console.error(
        "Fetch device PIN error:",
        error
      );


      if (
        error.name ===
        "CastError"
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid farmer ID",

          });

      }


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to fetch device PIN",

        });

    }

  }
);


// =====================================================
// ASSIGN / CHANGE DEVICE PIN
//
// Admin only.
//
// Used for:
// - Existing farmers
// - Resetting PIN
// - Changing PIN
//
// Endpoint:
// PATCH /api/admin/farmers/:farmerId/device-pin
// =====================================================

router.patch(
  "/farmers/:farmerId/device-pin",
  verifyAdmin,
  async (req, res) => {

    try {

      const cleanPin =
        String(
          req.body.devicePin || ""
        ).trim();


      // =================================================
      // VALIDATE PIN
      // =================================================

      if (
        !/^\d{4}$/.test(
          cleanPin
        )
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Device PIN must contain exactly 4 digits",

          });

      }


      // =================================================
      // UPDATE FARMER PIN
      // =================================================

      const farmer =
        await Farmer.findByIdAndUpdate(

          req.params.farmerId,

          {

            $set: {

              devicePin:
                cleanPin,

            },

          },

          {

            new: true,

            runValidators: true,

          }

        );


      // =================================================
      // FARMER NOT FOUND
      // =================================================

      if (!farmer) {

        return res
          .status(404)
          .json({

            success: false,

            message:
              "Farmer not found",

          });

      }


      // =================================================
      // SUCCESS
      // =================================================

      return res.json({

        success: true,

        message:
          "Device PIN updated successfully",

        farmer: {

          id:
            farmer._id,

          _id:
            farmer._id,

          name:
            farmer.name,

          storageId:
            farmer.storageId,

          hasDevicePin:
            true,

        },

      });

    }
    catch (error) {

      console.error(
        "Device PIN update error:",
        error
      );


      if (
        error.name ===
        "CastError"
      ) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Invalid farmer ID",

          });

      }


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to update device PIN",

        });

    }

  }
);


// =====================================================
// GET ENTRY LOGS
//
// Admin only.
//
// Endpoint:
// GET /api/admin/entry-logs/:storageId
//
// Retrieves physical VOOLER access events.
// Backend event values remain:
//
// DOOR_ENTRY
// DOOR_CLOSED
//
// Frontend can display these as:
// Entry
// Exit
// =====================================================

router.get(
  "/entry-logs/:storageId",
  verifyAdmin,
  async (req, res) => {

    try {

      const storageId =
        String(
          req.params.storageId || ""
        ).trim();


      // =================================================
      // VALIDATE STORAGE ID
      // =================================================

      if (!storageId) {

        return res
          .status(400)
          .json({

            success: false,

            message:
              "Storage ID is required",

          });

      }


      // =================================================
      // FETCH ENTRY LOGS
      // =================================================

      const entryLogs =
        await EntryLog
          .find({
            storageId,
          })
          .sort({
            timestamp: -1,
          })
          .limit(100)
          .lean();


      // =================================================
      // SUCCESS
      // =================================================

      return res.json({

        success: true,

        storageId,

        count:
          entryLogs.length,

        entryLogs,

      });

    }
    catch (error) {

      console.error(
        "Fetch entry logs error:",
        error
      );


      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to fetch entry logs",

        });

    }

  }
);


module.exports = router;