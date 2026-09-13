const mongoose = require("mongoose");

const readingSchema =
  new mongoose.Schema(
    {
      storageId: {
        type: String,
        required: true,
        trim: true,
      },

      chamber1Temperature: {
        type: Number,
        required: true,
      },

      chamber2Temperature: {
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


module.exports =
  mongoose.model(
    "Reading",
    readingSchema
  );