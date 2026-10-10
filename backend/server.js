const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use("/uploads",express.static(path.join(__dirname, "uploads")));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Local Community Hub API is running");
});

// Business API routes
app.use("/api/businesses", require("./routes/businessRoutes"));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });