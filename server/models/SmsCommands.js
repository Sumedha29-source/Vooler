const mongoose = require("mongoose");

const smsCommandSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    storageId: {
      type: String,
      required: true,
      default: "CS001",
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "sent"],
      default: "pending",
    },

    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SmsCommand",
  smsCommandSchema
);