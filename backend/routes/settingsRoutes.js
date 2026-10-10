const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const { protect, restrictTo } = require("../middleware/auth");

// GET all settings
router.get("/", async (req, res, next) => {
  try {
    const settingsList = await Setting.find();
    const settings = {};
    settingsList.forEach(s => settings[s.key] = s.value);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// POST update settings
router.post("/", protect, restrictTo("admin"), async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: "Settings saved" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
