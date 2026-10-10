const express = require("express");
const Notification = require("../models/Notification");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// List alerts (newest first). Use ?unread=true to see only unread ones
router.get("/", async (req, res) => {
  try {
    const filter = req.query.unread === "true" ? { isRead: false } : {};
    const notifications = await Notification.find(filter).sort({ createdAt: -1 });
    res.json({ count: notifications.length, notifications });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all as read
router.put("/read-all", async (req, res) => {
  try {
    const result = await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: "All marked as read", changed: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark one as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { returnDocument: "after" }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (err) {
    res.status(400).json({ message: "Invalid notification id" });
  }
});

module.exports = router;