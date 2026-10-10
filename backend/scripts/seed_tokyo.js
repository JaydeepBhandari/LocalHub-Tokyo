const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: '../.env' });

const User = require("../models/User");

async function seedTokyo() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/localhub-tokyo");
    console.log("Connected to MongoDB");

    // Create admin user
    const adminExists = await User.findOne({ email: "admin@localhub.com" });
    if (!adminExists) {
      await User.create({
        name: "Admin",
        email: "admin@localhub.com",
        password: "admin123",
        role: "admin",
      });
      console.log("Created admin user: admin@localhub.com / admin123");
    } else {
      console.log("Admin user already exists.");
    }

    console.log("\nSeed complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seedTokyo();
