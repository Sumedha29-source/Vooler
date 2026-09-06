const express = require("express");
const Farmer = require("../models/Farmers");

const router = express.Router();

// ================================
// REGISTER FARMER
// ================================

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      phone,
      simNumber,
      storageId,
      language,
      deviceKey,
    } = req.body;

    if (
      !name ||
      !phone ||
      !simNumber ||
      !storageId ||
      !deviceKey
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const existingFarmer = await Farmer.findOne({
      $or: [
        { phone },
        { simNumber },
        { storageId },
      ],
    });

    if (existingFarmer) {
      return res.status(409).json({
        success: false,
        message: "Farmer already exists",
      });
    }

    const farmer = await Farmer.create({
      name: name.trim(),
      phone: phone.trim(),
      simNumber: simNumber.trim(),
      storageId: storageId.trim(),
      language: language || "en",
      deviceKey: deviceKey.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Farmer registered successfully",
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
    console.error("Registration error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ================================
// LOGIN FARMER
// ================================

router.post("/login", async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    const farmer = await Farmer.findOne({
      phone: phone.trim(),
    });

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    if (
      farmer.name.trim().toLowerCase() !==
      name.trim().toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Farmer name does not match",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      farmer: {
        id: farmer._id,
        name: farmer.name,
        phone: farmer.phone,
        storageId: farmer.storageId,
        simNumber: farmer.simNumber,
        language: farmer.language,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;