const mongoose = require("mongoose");

const entryLogSchema = new mongoose.Schema(
  {
    // Cold-storage unit that generated the event
    storageId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Time sent by the device / test website
    timestamp: {
      type: Date,
      required: true,
    },

    // For now this identifies this as a door-entry event.
    // Later we can expand this for keypad access,
    // door closing, denied access, etc.
    eventType: {
      type: String,
      enum: [
        "DOOR_ENTRY",
        "DOOR_CLOSED",
      ],
      default: "DOOR_ENTRY",
    },
  },
  {
    // MongoDB/Mongoose will additionally create:
    // createdAt = server/database record creation time
    // updatedAt = last update time
    timestamps: true,
  }
);

// Useful for displaying newest entries first
entryLogSchema.index({
  storageId: 1,
  timestamp: -1,
});

module.exports = mongoose.model(
  "EntryLog",
  entryLogSchema
);