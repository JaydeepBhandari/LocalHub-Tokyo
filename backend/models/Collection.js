const mongoose = require("mongoose");

const CollectionSchema = new mongoose.Schema(
  {
    title: { en: String, ja: String },
    slug: { type: String, required: true, unique: true },
    description: String,
    spots: [{ type: mongoose.Schema.Types.ObjectId, ref: "Business" }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    coverImage: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Collection", CollectionSchema);
