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
    // 4-DIGIT DOOR ACCESS PIN
    //
    // select: false means normal Farmer queries will NOT
    // return the PIN to the frontend.
    //
    // Existing farmers can temporarily have null until
    // an admin assigns them a PIN.
    // =====================================================

    devicePin: {
      type: String,
      default: null,
      select: false,

      validate: {
        validator: function (value) {
          return (
            value === null ||
            /^\d{4}$/.test(value)
          );
        },

        message:
          "Device PIN must contain exactly 4 digits",
      },
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