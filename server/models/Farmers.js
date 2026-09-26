const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    simNumber: {
      type: String,
      required: true,
      trim: true,
    },

    storageId: {
      type: String,
      default: "CS001",
      immutable: true,
    },

    language: {
      type: String,
      enum: ["en", "bn", "hi", "as"],
      default: "en",
    },

    deviceKey: {
      type: String,
      default: "vooler-device-001",
      immutable: true,
    },

    // =====================================================
    // COLD STORAGE INSTALLATION LOCATION
    // =====================================================

    location: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null,
      },

      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null,
      },

      placeName: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Farmer",
  farmerSchema
);