const mongoose =
  require("mongoose");

const readingSchema =
  new mongoose.Schema(
    {
      // ========================================
      // STORAGE ID
      // ========================================

      storageId: {
        type: String,
        required: true,
        trim: true,
      },

      // ========================================
      // TEMPERATURE
      // ========================================

      temperature: {
        type: Number,
        required: true,
      },

      // ========================================
      // HUMIDITY
      // ========================================

      humidity: {
        type: Number,
        required: true,
      },

      // ========================================
      // POWER
      // ========================================

      power: {
        type: Boolean,
        required: true,
      },

      // ========================================
      // DEVICE ONLINE STATUS
      // ========================================

      online: {
        type: Boolean,
        default: true,
      },

      // ========================================
      // BATTERY
      // ========================================
      //
      // Currently your ESP sends 100.
      // Later you can connect real battery sensing.
      //

      battery: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },

      // ========================================
      // PELTIER STATUS
      // ========================================

      peltiersOn: {
        type: Boolean,
        default: false,
      },
    },

    {
      timestamps: true,
    }
  );


// ========================================
// INDEX
// ========================================
//
// Makes latest-reading searches faster:
//
// storageId = CS001
// newest createdAt first
//

readingSchema.index({
  storageId: 1,
  createdAt: -1,
});


module.exports =
  mongoose.model(
    "Reading",
    readingSchema
  );