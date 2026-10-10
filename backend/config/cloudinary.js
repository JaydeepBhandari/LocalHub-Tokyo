
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.vwrnoymx,
  api_key: process.env.823536767892933,
  api_secret: process.env.**********,
});

module.exports = cloudinary;
