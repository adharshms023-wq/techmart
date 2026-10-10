const express = require("express");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Add a customer
router.post("/", async (req, res) => {
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

// List all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one customer
router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    res.status(400).json({ message: "Invalid customer id" });
  }
});

// Edit a customer
router.put("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
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

// All orders of one customer
router.get("/:id/orders", async (req, res) => {
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