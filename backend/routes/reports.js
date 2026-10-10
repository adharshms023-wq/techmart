const express = require("express");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/summary", async (req, res) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      lowStockCount,
      revenueResult,
      statusResult,
    ] = await Promise.all([
      Product.countDocuments(),
      Customer.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ stock: { $lte: 10 } }),
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].revenue : 0;

    const ordersByStatus = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
    statusResult.forEach((s) => {
      ordersByStatus[s._id] = s.count;
    });

    res.json({
      totalProducts,
      totalCustomers,
      totalOrders,
      lowStockCount,
      totalRevenue,
      ordersByStatus,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// Best-selling products
router.get("/top-products", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);

    const result = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: limit },
      { $project: { _id: 0, productId: "$_id", name: 1, unitsSold: 1, revenue: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Sales for each of the last N days
router.get("/sales-by-day", async (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);

    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const result = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" }, createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", orders: 1, revenue: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;