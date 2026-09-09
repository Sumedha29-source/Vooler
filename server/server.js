const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/device");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");

dotenv.config();

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// Allow frontend requests
app.use(cors());

// Allow JSON request bodies
app.use(express.json());


// ========================================
// API ROUTES
// ========================================

// Farmer login / auth routes
app.use("/api/auth", authRoutes);

// ESP32 / device data routes
app.use("/api/device", deviceRoutes);

// Dashboard data routes
app.use("/api/dashboard", dashboardRoutes);

// Admin portal routes
app.use("/api/admin", adminRoutes);


// ========================================
// ROOT TEST ROUTE
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "VOOLER backend is running",
  });
});


// ========================================
// PORT
// ========================================

const PORT = process.env.PORT || 5000;


// ========================================
// START SERVER
// ========================================

const startServer = async () => {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(
      process.env.MONGO_URI,
      {
        serverSelectionTimeoutMS: 10000,
      }
    );

    console.log(
      "MongoDB connected successfully"
    );

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `VOOLER server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:"
    );

    console.error(
      error.message
    );
  }
};

startServer();