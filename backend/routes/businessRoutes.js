const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const upload = require("../middleware/upload");

// GET: Retrieve all businesses
router.get("/", async (req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Retrieve one business
router.get("/:id", async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(business);
  } catch (error) {
    res.status(400).json({ message: "Invalid business ID" });
  }
});

// POST: Add a business
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const business = new Business({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      address: req.body.address,
      phone: req.body.phone,
      rating: req.body.rating,
      openingTime: req.body.openingTime,
      closingTime: req.body.closingTime,
      image: req.file ? `/uploads/${req.file.filename}` : ""
    });

    const savedBusiness = await business.save();
    res.status(201).json(savedBusiness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT: Update a business
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updateData = {
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      address: req.body.address,
      phone: req.body.phone,
      rating: req.body.rating,
      openingTime: req.body.openingTime,
      closingTime: req.body.closingTime
    };

    // Save the new image path only if a new image was uploaded.
    // Otherwise, preserve the existing image.
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    // Remove undefined values so omitted fields remain unchanged.
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json(updatedBusiness);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE: Delete a business
router.delete("/:id", async (req, res) => {
  try {
    const deletedBusiness = await Business.findByIdAndDelete(req.params.id);

    if (!deletedBusiness) {
      return res.status(404).json({ message: "Business not found" });
    }

    res.json({ message: "Business deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Invalid business ID" });
  }
});

module.exports = router;