const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { protect, restrictTo } = require("../middleware/auth");

// GET all events
router.get("/", async (req, res, next) => {
  try {
    const { status, category, limit = 50, sort = "startDate" } = req.query;
    
    let query = {};
    if (status) query.status = status;
    else query.status = "published";
    
    if (category) query.category = category;

    const events = await Event.find(query)
      .sort(sort)
      .limit(Number(limit))
      .populate("businessId", "name slug location");
      
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
});

// GET single event
router.get("/:idOrSlug", async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const query = idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? { _id: idOrSlug } : { slug: idOrSlug };
    
    const event = await Event.findOne(query).populate("businessId", "name slug location geo");
    
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// POST new event (Admin only)
router.post("/", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// PUT update event (Admin only)
router.put("/:id", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
});

// DELETE event (Admin only)
router.delete("/:id", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, message: "Event deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
