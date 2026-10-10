const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const protect = require("../middleware/auth");
const notify = require("../utils/notify");
const LOW_STOCK_LIMIT = 10;

const router = express.Router();

router.use(protect);

// Place an order
router.post("/", async (req, res) => {
  try {
    const { customerName, customerEmail, items } = req.body;

    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Customer name and items are required" });
    }

    const orderItems = [];
    let totalAmount = 0;

    // Part 1: check everything first
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be a whole number, 1 or more" });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.stock < quantity) {
        return res.status(400).json({ message: "Not enough stock for " + product.name });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity,
      });
      totalAmount += product.price * quantity;
    }

    // Part 2: subtract the stock
       // Part 2: subtract the stock
    for (const oi of orderItems) {
      const updated = await Product.findByIdAndUpdate(
        oi.product,
        { $inc: { stock: -oi.quantity } },
        { returnDocument: "after" }
      );
      if (updated.stock <= LOW_STOCK_LIMIT) {
        await notify("low_stock", updated.name + " is low on stock (" + updated.stock + " left)");
      }
    }

    // Part 3: save the order
    const order = await Order.create({
      customerName,
      customerEmail,
      items: orderItems,
      totalAmount,
    });
    await notify("new_order", "New order from " + customerName + ": Rs " + totalAmount);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Invalid order id" });
  }
});

// Which moves are allowed
const allowedMoves = {
  pending: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Change an order's status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!allowedMoves[order.status].includes(status)) {
      return res
        .status(400)
        .json({ message: "Cannot change from " + order.status + " to " + status });
    }

    // Cancelled: put the stock back
    if (status === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Invalid order id" });
  }
});
module.exports = router;