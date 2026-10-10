require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Business = require('../models/Business');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Business.countDocuments();
  const cats = await Business.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log('Total spots:', count);
  console.log('Categories:');
  for (const c of cats) {
    console.log(`  ${c._id}: ${c.count}`);
  }
  await mongoose.disconnect();
}

check().catch(e => { console.error(e); process.exit(1); });
