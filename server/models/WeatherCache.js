const mongoose = require("mongoose");

const weatherCacheSchema = new mongoose.Schema(
  {
    storageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },

      placeName: {
        type: String,
        default: "",
      },
    },

    timezone: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      required: true,
    },

    forecast: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "WeatherCache",
  weatherCacheSchema
);