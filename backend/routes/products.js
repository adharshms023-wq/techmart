const express = require("express");
const Product = require("../models/Product");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Add a product
router.post("/", async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// List all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Products that are running low on stock
router.get("/low-stock", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const products = await Product.find({ stock: { $lte: limit } }).sort({ stock: 1 });
    res.json({ limit, count: products.length, products });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Invalid product id" });
  }
});

// Edit a product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(400).json({ message: "Invalid product id" });
  }
});

// Approximate rate, change it whenever you like
const USD_TO_INR = 85;

// Import products from an external API
router.post("/import", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 30);

    // Stage 1: fetch
    const response = await fetch(
      "https://dummyjson.com/products?limit=" +
        limit +
        "&select=title,description,category,price,brand,stock,thumbnail"
    );
    if (!response.ok) {
      return res.status(502).json({ message: "The external API returned an error" });
    }
    const data = await response.json();

    let imported = 0;
    const skipped = [];

    for (const item of data.products) {
      // Stage 2: validate
      if (!item.title || !item.category || typeof item.price !== "number" || item.price < 0) {
        skipped.push({ name: item.title || "(no title)", reason: "missing or invalid data" });
        continue;
      }

      // Stage 4a: skip duplicates
      const exists = await Product.findOne({ name: item.title });
      if (exists) {
        skipped.push({ name: item.title, reason: "already in the database" });
        continue;
      }

      // Stage 3: transform, then Stage 4b: save
      await Product.create({
        name: item.title,
        brand: item.brand || "",
        category: item.category,
        price: Math.round(item.price * USD_TO_INR),
        stock: Number.isInteger(item.stock) ? item.stock : 0,
        description: item.description || "",
        imageUrl: item.thumbnail || "",
      });
      imported++;
    }

    res.json({ fetched: data.products.length, imported, skipped });
  } catch (err) {
    res.status(502).json({ message: "Could not reach the external API: " + err.message });
  }
});

module.exports = router;