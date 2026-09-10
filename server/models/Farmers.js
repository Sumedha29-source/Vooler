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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Farmer",
  farmerSchema
);