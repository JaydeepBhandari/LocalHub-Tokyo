const mongoose = require("mongoose");
const slugify = require("slugify");

const eventSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      ja: { type: String, default: "" },
    },
    slug: { type: String, unique: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["matsuri", "art", "music", "food", "market", "sports", "seasonal", "tech/culture"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isDatesTBA: { type: Boolean, default: false },
    recurringRule: { type: String, enum: ["annual", "monthly", "weekly", "none"], default: "none" },
    venueName: { type: String, default: "" },
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", default: null },
    ward: { type: String, default: "" },
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    ticketInfo: { type: String, default: "Free" },
    officialUrl: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    images: [{
      url: { type: String, required: true },
      credit: { type: String, default: '' },
      isCover: { type: Boolean, default: false }
    }],
    status: {
      type: String,
      enum: ["draft", "published", "archived", "cancelled"],
      default: "published",
    },
    lastVerifiedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

eventSchema.index({ geo: "2dsphere" });
eventSchema.index({ startDate: 1, endDate: 1 });

eventSchema.pre("save", function () {
  if (this.isModified("title.en")) {
    this.slug = slugify(this.title.en, { lower: true, strict: true }) + "-" + Date.now().toString(36);
  }
});

module.exports = mongoose.model("Event", eventSchema);
