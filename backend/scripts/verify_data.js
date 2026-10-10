const mongoose = require('mongoose');
const Business = require('../models/Business');
require('dotenv').config({ path: '../.env' });

async function verifyData() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/localhub-tokyo');
  console.log("Connected to DB. Verifying data...");

  const count = await Business.countDocuments({ status: 'approved' });
  if (count < 60 || count > 80) {
    console.error(`ERROR: Expected 60-80 spots, found ${count}`);
    process.exit(1);
  } else {
    console.log(`SUCCESS: Found ${count} approved spots.`);
  }

  // Check iconic spots
  const iconic = await Business.findOne({ $or: [{ name: /Tokyo Skytree/i }, { nameJa: /東京スカイツリー/ }]});
  if (!iconic) {
    console.error(`ERROR: Tokyo Skytree missing`);
    process.exit(1);
  }
  
  if (iconic.category !== "Landmarks and Views") {
    console.error(`ERROR: Tokyo Skytree category is ${iconic.category}, expected Landmarks and Views`);
    process.exit(1);
  }

  // Check coordinates
  const noCoords = await Business.countDocuments({ "geo.coordinates": [0, 0] });
  if (noCoords > 0) {
    console.error(`ERROR: Found ${noCoords} spots with [0,0] coordinates.`);
    process.exit(1);
  }
  
  // Check duplicates
  const all = await Business.find({});
  const names = new Set();
  for (const b of all) {
    const norm = b.name.toLowerCase().replace(/[^\w]/g, '');
    if (names.has(norm)) {
      console.error(`ERROR: Duplicate spot found: ${b.name}`);
      process.exit(1);
    }
    names.add(norm);
  }

  console.log("All data verifications passed!");
  process.exit(0);
}

verifyData();
