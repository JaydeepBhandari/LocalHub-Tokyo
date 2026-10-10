const mongoose = require("mongoose");

const FavoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    itemType: { type: String, enum: ["Business", "Event"], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ user: 1, itemId: 1, itemType: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", FavoriteSchema);
