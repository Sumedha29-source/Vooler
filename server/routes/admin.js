const express = require("express");
const Farmer = require("../models/Farmers");

const router = express.Router();

// ========================================
// CHECK ADMIN KEY
// ========================================

const verifyAdmin = (req, res, next) => {
  const adminKey = req.header("x-admin-key");

  if (!adminKey) {
    return res.status(401).json({
      success: false,
      message: "Admin key required",
    });
  }

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Invalid admin key",
    });
  }

  next();
};


// ========================================
// VERIFY ADMIN LOGIN
// POST /api/admin/verify
// ========================================

router.post(
  "/verify",
  verifyAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: "Admin access granted",
    });
  }
);


// ========================================
// REGISTER NEW FARMER
// POST /api/admin/register
// ========================================

router.post(
  "/register",
  verifyAdmin,
  async (req, res) => {
    try {
      const {
        name,
        phone,
        simNumber,
        storageId,
        language,
        deviceKey,
      } = req.body;

      // Check required fields
      if (
        !name ||
        !phone ||
        !simNumber ||
        !storageId ||
        !language ||
        !deviceKey
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All farmer and device details are required",
        });
      }

      // Check mobile numbers
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          message:
            "Farmer mobile number must contain 10 digits",
        });
      }

      if (!/^\d{10}$/.test(simNumber)) {
        return res.status(400).json({
          success: false,
          message:
            "SIM800L mobile number must contain 10 digits",
        });
      }

      // Check language
      const supportedLanguages = [
        "en",
        "bn",
        "hi",
        "as",
      ];

      if (
        !supportedLanguages.includes(language)
      ) {
        return res.status(400).json({
          success: false,
          message: "Unsupported language",
        });
      }

      // Check whether any value is already registered
      const existingFarmer =
        await Farmer.findOne({
          $or: [
            { phone: phone.trim() },
            { storageId: storageId.trim() },
            { deviceKey: deviceKey.trim() },
          ],
        });

      if (existingFarmer) {
        return res.status(409).json({
          success: false,
          message:
            "Farmer mobile number, storage ID or device key already exists",
        });
      }

      // Create farmer
      const farmer = await Farmer.create({
        name: name.trim(),
        phone: phone.trim(),
        simNumber: simNumber.trim(),
        storageId: storageId.trim(),
        language,
        deviceKey: deviceKey.trim(),
      });

      res.status(201).json({
        success: true,
        message:
          "Farmer registered successfully",

        farmer: {
          id: farmer._id,
          name: farmer.name,
          phone: farmer.phone,
          simNumber: farmer.simNumber,
          storageId: farmer.storageId,
          language: farmer.language,
        },
      });
    } catch (error) {
      console.error(
        "Admin registration error:",
        error
      );

      // MongoDB duplicate-key error
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "One of these details is already registered",
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


// ========================================
// GET REGISTERED FARMERS
// GET /api/admin/farmers
// ========================================

router.get(
  "/farmers",
  verifyAdmin,
  async (req, res) => {
    try {
      const farmers = await Farmer.find()
        .select("-deviceKey")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: farmers.length,
        farmers,
      });
    } catch (error) {
      console.error(
        "Fetch farmers error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);


module.exports = router;