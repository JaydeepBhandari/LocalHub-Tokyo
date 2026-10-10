const mongoose = require("mongoose");

const AnalyticsEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true }, // e.g., 'page_view', 'search', 'click_direction'
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    metadata: { type: Object },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("AnalyticsEvent", AnalyticsEventSchema);
