const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());

// ================================
// ROUTES
// ================================

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "VOOLER backend is running",
  });
});

// ================================
// PORT
// ================================

const PORT = process.env.PORT || 5000;

// ================================
// START SERVER
// ================================

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`VOOLER server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    process.exit(1);
  }
};

startServer();