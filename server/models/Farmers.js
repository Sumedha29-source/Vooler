const mongoose = require("mongoose");

// ================================
// FARMER SCHEMA
// ================================

const farmerSchema = new mongoose.Schema(
  {
    // Farmer's name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Farmer's registered mobile number
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // SIM number installed in the
    // corresponding VOOLER storage unit
    simNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique ID of the VOOLER storage unit
    storageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Farmer's preferred language
    //
    // en = English
    // bn = Bengali
    // hi = Hindi
    // as = Assamese
    language: {
      type: String,
      enum: ["en", "bn", "hi", "as"],
      default: "en",
    },

    // Secret key used by the ESP32/device
    // when sending sensor data to the backend
    deviceKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },

  {
    // Automatically creates:
    // createdAt
    // updatedAt
    timestamps: true,
  }
);

// ================================
// EXPORT MODEL
// ================================

module.exports = mongoose.model(
  "Farmer",
  farmerSchema
);