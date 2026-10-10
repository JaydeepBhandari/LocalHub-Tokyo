const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors({
  origin: true,
  credentials: true,
}));

// Request logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests. Try again later." },
});
app.use("/api", limiter);

// CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];
app.use(cors({ origin: corsOrigins, credentials: true }));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: dbStatus === 1 ? 'ok' : 'error',
    database: statusMap[dbStatus] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LocalHub API v1 is running",
    version: "1.0.0",
  });
});

// API routes (versioned)
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/businesses", require("./routes/businessRoutes"));
app.use("/api/v1/reviews", require("./routes/reviewRoutes"));
app.use("/api/v1/settings", require("./routes/settingsRoutes"));
app.use("/api/v1/events", require("./routes/eventRoutes"));

// Central error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
let server;

const connectWithRetry = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/localhub-tokyo";
  console.log('MongoDB connection with retry');
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
    
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error("MongoDB connection unsuccessful, retry after 5 seconds.", err.message);
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();

// Graceful shutdown
const gracefulShutdown = () => {
  console.log("Shutting down gracefully...");
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      mongoose.connection.close(false).then(() => {
        console.log("MongoDB connection closed.");
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);