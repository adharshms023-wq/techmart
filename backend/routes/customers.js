const express = require("express");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Get current logged-in customer's profile
router.get("/me", async (req, res) => {
  try {
    const id = req.customerId || req.user.id;
    const customer = await Customer.findById(id).select("-password");
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update current logged-in customer's profile
router.put("/me", async (req, res) => {
  try {
    const id = req.customerId || req.user.id;
    const { name, phone, address } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      id,
      { name, phone, address },
      { returnDocument: "after", runValidators: true }
    ).select("-password");
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a customer (admin only)
router.post("/", protect.requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A customer with this email already exists" });
    }
    res.status(400).json({ message: err.message });
  }
});

// List all customers (admin only)
router.get("/", protect.requireAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().select("-password").sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one customer (admin only)
router.get("/:id", protect.requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).select("-password");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: "Invalid customer id" });
  }
});

// Edit a customer (admin only)
router.put("/:id", protect.requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A customer with this email already exists" });
    }
    res.status(400).json({ message: err.message });
  }
});

// All orders of one customer (admin only)
router.get("/:id/orders", protect.requireAdmin, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const orders = await Order.find({ customerEmail: customer.email }).sort({ createdAt: -1 });
    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({ customer: customer.name, orderCount: orders.length, totalSpent, orders });
  } catch (err) {
    res.status(400).json({ message: "Invalid customer id" });
  }
});

module.exports = router;
