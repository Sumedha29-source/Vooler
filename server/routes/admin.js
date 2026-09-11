const express = require("express");

const Farmer = require("../models/Farmers");
const SmsCommand = require("../models/SmsCommands");

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
      } = req.body;


      // =================================================
      // REQUIRED FIELDS
      // =================================================

      if (
        !name ||
        !phone ||
        !simNumber
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Name, phone number and SIM number are required",
          });
      }


      // =================================================
      // CLEAN VALUES
      // =================================================

      const cleanName =
        name.trim();

      const cleanPhone =
        phone.trim();

      const cleanSimNumber =
        simNumber.trim();

      const cleanLanguage =
        language || "en";


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
      //
      // Farmers.js automatically assigns:
      //
      // storageId = CS001
      // deviceKey = vooler-device-001
      // =================================================

      const farmer =
        new Farmer({
          name: cleanName,

          phone: cleanPhone,

          simNumber:
            cleanSimNumber,

          language:
            cleanLanguage,
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

      let smsQueued = false;


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


        smsQueued = true;


        console.log(
          "Welcome SMS queued for:",
          farmer.phone
        );
      }
      catch (smsError) {
        console.error(
          "Unable to queue welcome SMS:"
        );

        console.error(
          smsError.message
        );
      }


      // =================================================
      // SUCCESS RESPONSE
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

            name:
              farmer.name,

            phone:
              farmer.phone,

            simNumber:
              farmer.simNumber,

            storageId:
              farmer.storageId,

            deviceKey:
              farmer.deviceKey,

            language:
              farmer.language,
          },
        });
    }
    catch (error) {
      console.error(
        "Farmer registration error:"
      );

      console.error(error);


      // =================================================
      // DUPLICATE KEY ERROR
      // =================================================

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


      // =================================================
      // GENERAL SERVER ERROR
      // =================================================

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
          });


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


module.exports = router;