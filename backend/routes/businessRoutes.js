const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const upload = require("../middleware/upload");
const { protect, restrictTo } = require("../middleware/auth");
const slugify = require("slugify");
const { z } = require("zod");

// Input validation schema
const businessSchemaZod = z.object({
  name: z.string().min(1, "Name is required").max(200),
  nameJa: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  area: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  priceLevel: z.union([z.number(), z.string()]).optional().nullable(),
  hoursText: z.string().optional(),
  status: z.enum(["draft", "pending", "approved", "rejected", "archived"]).optional(),
  lat: z.union([z.number(), z.string()]).optional(),
  lng: z.union([z.number(), z.string()]).optional(),
  station: z.string().optional(),
  line: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.union([z.boolean(), z.string()]).optional(),
  isVerified: z.union([z.boolean(), z.string()]).optional(),
});

// GET /api/v1/businesses — list with search, filter, sort, pagination, geo search
router.get("/", async (req, res, next) => {
  try {
    const {
      search, category, openNow, minRating, sort,
      page = 1, limit = 12, featured, status,
      lat, lng, radius, bbox
    } = req.query;

    const query = {};

    // Only show approved businesses for public requests
    if (!req.headers.authorization) {
      query.status = "approved";
    } else if (status) {
      query.status = status;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    if (category && category !== "All") query.category = category;
    if (minRating) query.avgRating = { $gte: Number(minRating) };
    if (featured === "true") query.isFeatured = true;

    // Geo queries
    if (lat && lng) {
      const maxDist = radius ? Number(radius) * 1000 : 25000; // default 25km
      query.geo = {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: maxDist
        }
      };
    } else if (bbox) {
      // bbox format: minLng,minLat,maxLng,maxLat
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      query.geo = {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat]
          ]
        }
      };
    }

    // Sort options
    let sortOption = { createdAt: -1 };
    if (search && !sort) {
      sortOption = { score: { $meta: "textScore" } };
    } else {
      switch (sort) {
        case "rating": sortOption = { avgRating: -1 }; break;
        case "name": sortOption = { name: 1 }; break;
        case "newest": sortOption = { createdAt: -1 }; break;
        case "oldest": sortOption = { createdAt: 1 }; break;
        case "nearest": 
          if (lat && lng) sortOption = {}; // $near sorts by distance automatically
          break;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const findArgs = query.$text ? [query, { score: { $meta: "textScore" } }] : [query];
    
    const total = await Business.countDocuments(query);
    const businesses = await Business.find(...findArgs)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: businesses,
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

// GET /api/v1/businesses/stats — admin dashboard stats
router.get("/stats", async (req, res, next) => {
  try {
    const total = await Business.countDocuments();
    const approved = await Business.countDocuments({ status: "approved" });
    const pending = await Business.countDocuments({ status: "pending" });
    const featured = await Business.countDocuments({ isFeatured: true });

    const categoryStats = await Business.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const ratingStats = await Business.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$avgRating" },
          topRated: { $max: "$avgRating" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        total, approved, pending, featured,
        categories: categoryStats,
        avgRating: ratingStats.length > 0 ? Math.round(ratingStats[0].avgRating * 10) / 10 : 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/businesses/categories — list unique categories
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Business.distinct("category");
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/businesses/:idOrSlug — single business
router.get("/:idOrSlug", async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let business;

    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      business = await Business.findById(idOrSlug).populate("claimedBy", "name");
    } else {
      business = await Business.findOne({ slug: idOrSlug }).populate("claimedBy", "name");
    }

    if (!business) {
      return res.status(404).json({ success: false, message: "Business not found." });
    }

    // Increment view count
    business.viewCount += 1;
    await business.save();

    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/businesses — create (admin only)
router.post(
  "/",
  protect,
  restrictTo("admin", "editor"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      const validatedData = businessSchemaZod.parse(req.body);

      const businessData = {
        ...validatedData,
        isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
        isVerified: req.body.isVerified === "true" || req.body.isVerified === true,
        priceLevel: req.body.priceLevel ? Number(req.body.priceLevel) : null,
        createdBy: req.user._id,
        status: req.body.status || "approved",
      };

      if (req.body.tags) {
        businessData.tags = typeof req.body.tags === "string"
          ? req.body.tags.split(",").map(t => t.trim())
          : req.body.tags;
      }

      if (req.body.lat && req.body.lng) {
        businessData.geo = {
          type: "Point",
          coordinates: [Number(req.body.lng), Number(req.body.lat)]
        };
      }
      
      // Handle structured hours if sent as JSON string
      if (req.body.hours) {
        try {
          businessData.hours = typeof req.body.hours === 'string' ? JSON.parse(req.body.hours) : req.body.hours;
        } catch(e) {}
      }

      if (req.file) {
        businessData.images = [{
          url: `/uploads/${req.file.filename}`,
          source: 'local',
          isCover: true
        }];
      } else if (req.body.imageUrl) {
        businessData.images = [{
          url: req.body.imageUrl,
          source: 'unsplash',
          isCover: true
        }];
      }

      const business = await Business.create(businessData);
      res.status(201).json({ success: true, data: business });
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, message: "Validation failed", errors: error.errors });
      }
      next(error);
    }
  }
);

// PUT /api/v1/businesses/:id — update (admin only)
router.put(
  "/:id",
  protect,
  restrictTo("admin", "editor"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      const updateData = {};
      const fields = [
        "name", "category", "description", "location", "area", "city", 
        "phone", "website", "hoursText", "status"
      ];

      fields.forEach((field) => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });
      
      if (req.body.priceLevel !== undefined) {
        updateData.priceLevel = req.body.priceLevel ? Number(req.body.priceLevel) : null;
      }

      if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured === "true" || req.body.isFeatured === true;
      if (req.body.isVerified !== undefined) updateData.isVerified = req.body.isVerified === "true" || req.body.isVerified === true;

      if (req.body.tags) {
        updateData.tags = typeof req.body.tags === "string"
          ? req.body.tags.split(",").map(t => t.trim())
          : req.body.tags;
      }

      if (req.body.lat && req.body.lng) {
        updateData.geo = {
          type: "Point",
          coordinates: [Number(req.body.lng), Number(req.body.lat)]
        };
      }
      
      if (req.body.hours) {
        try {
          updateData.hours = typeof req.body.hours === 'string' ? JSON.parse(req.body.hours) : req.body.hours;
        } catch(e) {}
      }

      if (req.file) {
        // Find business first to append image or replace
        const existingBusiness = await Business.findById(req.params.id);
        const newImage = {
          url: `/uploads/${req.file.filename}`,
          source: 'local',
          isCover: true
        };
        
        if (existingBusiness && existingBusiness.images) {
           existingBusiness.images.forEach(img => img.isCover = false);
           updateData.images = [newImage, ...existingBusiness.images];
        } else {
           updateData.images = [newImage];
        }
      } else if (req.body.imageUrl) {
        const newImage = {
          url: req.body.imageUrl,
          source: 'unsplash',
          isCover: true
        };
        const existingBusiness = await Business.findById(req.params.id);
        if (existingBusiness && existingBusiness.images) {
           existingBusiness.images.forEach(img => img.isCover = false);
           updateData.images = [newImage, ...existingBusiness.images];
        } else {
           updateData.images = [newImage];
        }
      }

      if (updateData.name) {
        updateData.slug = slugify(updateData.name, { lower: true, strict: true }) + "-" + Date.now().toString(36);
      }

      const business = await Business.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!business) return res.status(404).json({ success: false, message: "Business not found." });
      res.json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/v1/businesses/:id — delete (admin only)
router.delete("/:id", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const business = await Business.findByIdAndDelete(req.params.id);
    if (!business) return res.status(404).json({ success: false, message: "Business not found." });

    const Review = require("../models/Review");
    await Review.deleteMany({ business: req.params.id });

    res.json({ success: true, message: "Business and associated reviews deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;