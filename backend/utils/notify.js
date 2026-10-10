const Notification = require("../models/Notification");

async function notify(type, message) {
  try {
    await Notification.create({ type, message });
  } catch (err) {
    console.log("Notification error:", err.message);
  }
}

module.exports = notify;