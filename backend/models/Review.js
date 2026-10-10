const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reviews: one review per user per business
reviewSchema.index({ business: 1, user: 1 }, { unique: true });

// Static method to recalculate business rating
reviewSchema.statics.calcAverageRating = async function (businessId) {
  const Business = mongoose.model("Business");

  const stats = await this.aggregate([
    { $match: { business: businessId } },
    {
      $group: {
        _id: "$business",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Business.findByIdAndUpdate(businessId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  } else {
    await Business.findByIdAndUpdate(businessId, {
      avgRating: 0,
      reviewCount: 0,
    });
  }
};

// Recalculate after save
reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.business);
});

// Recalculate after delete
reviewSchema.post("findOneAndDelete", function (doc) {
  if (doc) {
    doc.constructor.calcAverageRating(doc.business);
  }
});

module.exports = mongoose.model("Review", reviewSchema);
