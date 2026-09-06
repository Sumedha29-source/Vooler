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
      unique: true,
      trim: true,
    },

    storageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    language: {
      type: String,
      enum: ["en", "bn"],
      default: "en",
    },

    deviceKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Farmer", farmerSchema);