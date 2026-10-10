const mongoose = require("mongoose");
const slugify = require("slugify");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: 200,
    },
    nameJa: {
      type: String,
      trim: true,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    ward: {
      type: String,
      trim: true,
      default: "",
    },
    area: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    geo: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      }
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: "",
    },
    station: { type: String, default: "" },
    line: { type: String, default: "" },
    paymentOptions: [{ type: String, enum: ["cash", "credit", "suica", "paypay"] }],
    socialLinks: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    priceLevel: {
      type: Number,
      min: 1,
      max: 4,
      default: null,
    },
    hours: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    hoursText: {
      type: String,
      default: "Hours not listed"
    },
    images: [{
      url: { type: String, required: true },
      thumbnailUrl: { type: String },
      source: { type: String, enum: ['local', 'google', 'foursquare', 'wikimedia', 'unsplash', 'pexels', 'osm', 'placeholder'], default: 'local' },
      credit: { type: String, default: '' },
      license: { type: String, default: '' },
      isCover: { type: Boolean, default: false }
    }],
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "archived"],
      default: "approved",
    },
    source: {
      type: String,
      enum: ['manual', 'osm', 'google', 'foursquare'],
      default: 'manual'
    },
    sourceId: {
      type: String,
      default: null
    },
    lastSyncedAt: {
      type: Date,
      default: null
    },
    lastVerifiedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
  }
);

businessSchema.index({ name: "text", nameJa: "text", description: "text", tags: "text", category: "text" });
businessSchema.index({ geo: "2dsphere" });
businessSchema.index({ sourceId: 1 }, { unique: true, sparse: true });
businessSchema.index({ ward: 1, category: 1, status: 1 });

businessSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.slug =
      slugify(this.name, { lower: true, strict: true }) +
      "-" +
      Date.now().toString(36);
  }
});

module.exports = mongoose.model("Business", businessSchema);