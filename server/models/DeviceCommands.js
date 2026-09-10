const mongoose = require("mongoose");

const deviceCommandSchema = new mongoose.Schema(
  {
    storageId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    emergencyShutdown: {
      type: Boolean,
      default: false,
    },

    requestedBy: {
      type: String,
      default: null,
    },

    requestedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DeviceCommand",
  deviceCommandSchema
);