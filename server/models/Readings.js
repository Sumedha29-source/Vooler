const mongoose = require("mongoose");

const readingSchema = new mongoose.Schema(
  {
    storageId: {
      type: String,
      required: true,
      trim: true,
    },

    temperature: {
      type: Number,
      required: true,
    },

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

module.exports = mongoose.model(
  "Reading",
  readingSchema
);