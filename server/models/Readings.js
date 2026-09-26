const mongoose = require("mongoose");

const readingSchema =
  new mongoose.Schema(
    {
      storageId: {
        type: String,
        required: true,
        trim: true,
      },

      // ===============================================
      // CURRENT TEMPERATURES FROM DS18B20 SENSORS
      // ===============================================

      chamber1Temperature: {
        type: Number,
        required: true,
      },

      chamber2Temperature: {
        type: Number,
        required: true,
      },

      // ===============================================
      // SET TEMPERATURES SELECTED ON VOOLER OLED
      // ===============================================

      chamber1SetTemperature: {
        type: Number,
        required: true,
      },

      chamber2SetTemperature: {
        type: Number,
        required: true,
      },

      // ===============================================
      // OTHER SENSOR DATA
      // ===============================================

      humidity: {
        type: Number,
        required: true,
      },

      power: {
        type: Boolean,
        required: true,
      },

      online: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );


readingSchema.index({
  storageId: 1,
  createdAt: -1,
});

// Automatically delete sensor readings after 90 days
readingSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports =
  mongoose.model(
    "Reading",
    readingSchema
  );