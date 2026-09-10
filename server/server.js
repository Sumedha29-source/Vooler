const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/device");
const dashboardRoutes = require("./routes/dashboard");
const adminRoutes = require("./routes/admin");
const deviceControlRoutes = require("./routes/deviceControl");

dotenv.config();

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// API ROUTES
// ========================================

// Farmer login
app.use(
  "/api/auth",
  authRoutes
);

// ESP32 sensor-data API
app.use(
  "/api/device",
  deviceRoutes
);

// Farmer dashboard API
app.use(
  "/api/dashboard",
  dashboardRoutes
);

// Admin portal API
app.use(
  "/api/admin",
  adminRoutes
);

// Emergency shutdown / resume commands
app.use(
  "/api/device-control",
  deviceControlRoutes
);


// ========================================
// ROOT ROUTE
// ========================================

app.get("/", (req, res) => {
  res.json({
    message: "VOOLER backend is running",
  });
});


// ========================================
// PORT
// ========================================

const PORT =
  process.env.PORT || 5000;


// ========================================
// START SERVER
// ========================================

const startServer = async () => {
  try {
    console.log(
      "Connecting to MongoDB..."
    );

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