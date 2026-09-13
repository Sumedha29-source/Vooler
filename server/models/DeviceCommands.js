const mongoose = require("mongoose");


// =====================================================
// DEVICE COMMAND SCHEMA
// =====================================================

const deviceCommandSchema =
  new mongoose.Schema(
    {
      // ===============================================
      // STORAGE ID
      // ===============================================

      storageId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },


      // ===============================================
      // EMERGENCY SHUTDOWN
      // ===============================================

      emergencyShutdown: {
        type: Boolean,
        default: false,
      },


      // ===============================================
      // CHAMBER 1 SET TEMPERATURE
      // ===============================================

      chamber1SetTemperature: {
        type: Number,
        default: 18,
      },


      // ===============================================
      // CHAMBER 2 SET TEMPERATURE
      // ===============================================

      chamber2SetTemperature: {
        type: Number,
        default: 18,
      },


      // ===============================================
      // WHO REQUESTED LAST CONTROL CHANGE
      // ===============================================

      requestedBy: {
        type: String,
        default: null,
      },


      // ===============================================
      // WHEN LAST CONTROL CHANGE WAS MADE
      // ===============================================

      requestedAt: {
        type: Date,
        default: null,
      },
    },

    {
      timestamps: true,
    }
  );


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
  mongoose.model(
    "DeviceCommand",
    deviceCommandSchema
  );