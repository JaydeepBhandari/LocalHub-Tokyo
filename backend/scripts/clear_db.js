const mongoose = require("mongoose");
const Business = require("../models/Business");
const Review = require("../models/Review");
require("dotenv").config({ path: "../.env" });

async function clearDB() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/localhub');
  console.log("Connected to DB. Clearing Portland/Surat data...");
  await Business.deleteMany({});
  await Review.deleteMany({});
  console.log("Database cleared.");
  process.exit(0);
}

clearDB();
