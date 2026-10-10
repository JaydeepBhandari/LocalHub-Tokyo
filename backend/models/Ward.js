const mongoose = require("mongoose");

const WardSchema = new mongoose.Schema(
  {
    name: { en: String, ja: String },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    geo: {
      type: { type: String, enum: ["Polygon", "MultiPolygon"] },
      coordinates: [],
    },
    population: Number,
    areaSqKm: Number,
  },
  { timestamps: true }
);

WardSchema.index({ geo: "2dsphere" });

module.exports = mongoose.model("Ward", WardSchema);
