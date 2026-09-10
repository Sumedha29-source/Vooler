const express = require("express");
const Farmer = require("../models/Farmers");

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


      // ---------------------------------------------
      // REQUIRED FIELDS
      // ---------------------------------------------

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


      // ---------------------------------------------
      // CLEAN VALUES
      // ---------------------------------------------

      const cleanName =
        name.trim();

      const cleanPhone =
        phone.trim();

      const cleanSimNumber =
        simNumber.trim();

      const cleanLanguage =
        language || "en";


      // ---------------------------------------------
      // PHONE VALIDATION
      // ---------------------------------------------

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


      // ---------------------------------------------
      // SIM NUMBER VALIDATION
      // ---------------------------------------------

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


      // ---------------------------------------------
      // LANGUAGE VALIDATION
      // ---------------------------------------------

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


      // ---------------------------------------------
      // CHECK FARMER PHONE ONLY
      // ---------------------------------------------

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


      // ---------------------------------------------
      // CREATE FARMER
      //
      // storageId and deviceKey are NOT entered
      // by the admin anymore.
      //
      // Farmers.js automatically assigns:
      //
      // storageId = CS001
      // deviceKey = vooler-device-001
      // ---------------------------------------------

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


      // ---------------------------------------------
      // SUCCESS
      // ---------------------------------------------

      return res
        .status(201)
        .json({

          success: true,

          message:
            "Farmer registered successfully",

          farmer: {

            id: farmer._id,

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

    } catch (error) {

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

    } catch (error) {

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