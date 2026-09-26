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
      location,
    } = req.body;


    // ================================
    // REQUIRED FIELD CHECK
    // ================================

    if (
      !name ||
      !phone ||
      !simNumber ||
      !storageId ||
      !deviceKey
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required fields must be provided",
      });
    }


    // ================================
    // LOCATION VALIDATION
    // ================================

    let installationLocation = {
      latitude: null,
      longitude: null,
      placeName: "",
    };


    if (location) {
      const latitude = Number(
        location.latitude
      );

      const longitude = Number(
        location.longitude
      );


      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid installation latitude",
        });
      }


      if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid installation longitude",
        });
      }


      installationLocation = {
        latitude,
        longitude,

        placeName:
          typeof location.placeName ===
          "string"
            ? location.placeName.trim()
            : "",
      };
    }


    // ================================
    // CHECK EXISTING FARMER / STORAGE
    // ================================

    const existingFarmer =
      await Farmer.findOne({
        $or: [
          { phone },
          { simNumber },
          { storageId },
        ],
      });


    if (existingFarmer) {
      return res.status(409).json({
        success: false,
        message:
          "Farmer already exists",
      });
    }


    // ================================
    // CREATE FARMER
    // ================================

    const farmer =
      await Farmer.create({
        name: name.trim(),
        phone: phone.trim(),
        simNumber: simNumber.trim(),
        storageId: storageId.trim(),
        language: language || "en",
        deviceKey: deviceKey.trim(),

        location:
          installationLocation,
      });


    // ================================
    // RESPONSE
    // ================================

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
        location: farmer.location,
      },
    });

  } catch (error) {
    console.error(
      "Registration error:",
      error.message
    );

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
    const {
      name,
      phone,
    } = req.body;


    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Name and phone number are required",
      });
    }


    const farmer =
      await Farmer.findOne({
        phone: phone.trim(),
      });


    if (!farmer) {
      return res.status(404).json({
        success: false,
        message:
          "Farmer not found",
      });
    }


    if (
      farmer.name
        .trim()
        .toLowerCase() !==
      name
        .trim()
        .toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Farmer name does not match",
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

        // Installation location is returned
        // so the dashboard can know which
        // storage location it represents.
        location:
          farmer.location || {
            latitude: null,
            longitude: null,
            placeName: "",
          },
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ================================
// GET FARMER DEVICE PIN
// ================================

router.post("/device-pin", async (req, res) => {
  try {
    const {
      farmerId,
      phone,
    } = req.body;


    // ================================
    // REQUIRED FIELD CHECK
    // ================================

    if (!farmerId || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "Farmer ID and phone number are required",
      });
    }


    // ================================
    // FIND FARMER
    // ================================
    //
    // devicePin has select: false in
    // Farmers.js, so we explicitly
    // request it only for this route.
    // ================================

    const farmer =
      await Farmer.findOne({
        _id: farmerId,
        phone: phone.trim(),
      }).select("+devicePin");


    if (!farmer) {
      return res.status(404).json({
        success: false,
        message:
          "Farmer not found",
      });
    }


    // ================================
    // CHECK PIN EXISTS
    // ================================

    if (!farmer.devicePin) {
      return res.status(404).json({
        success: false,
        message:
          "No device PIN has been assigned yet",
      });
    }


    // ================================
    // RETURN DEVICE PIN
    // ================================

    return res.status(200).json({
      success: true,
      devicePin: farmer.devicePin,
    });

  } catch (error) {
    console.error(
      "Device PIN fetch error:",
      error.message
    );


    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


module.exports = router;