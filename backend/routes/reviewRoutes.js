const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Business = require("../models/Business");
const { protect } = require("../middleware/auth");

// GET /api/v1/reviews?business=:businessId — list reviews for a business
router.get("/", async (req, res, next) => {
  try {
    const { business, page = 1, limit = 10 } = req.query;

    if (!business) {
      return res.status(400).json({
        success: false,
        message: "Business ID is required.",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ business });
    const reviews = await Review.find({ business })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/reviews — create a review (authenticated users)
router.post("/", protect, async (req, res, next) => {
  try {
    const { business, rating, comment } = req.body;

    if (!business || !rating) {
      return res.status(400).json({
        success: false,
        message: "Business ID and rating are required.",
      });
    }

    // Check business exists
    const biz = await Business.findById(business);
    if (!biz) {
      return res.status(404).json({
        success: false,
        message: "Business not found.",
      });
    }

    const review = await Review.create({
      business,
      user: req.user._id,
      userName: req.user.name,
      rating: Number(rating),
      comment: comment || "",
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this business.",
      });
    }
    next(error);
  }
});

// DELETE /api/v1/reviews/:id — delete a review (owner or admin)
router.delete("/:id", protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    // Only the review author or an admin can delete
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review.",
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Review deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
