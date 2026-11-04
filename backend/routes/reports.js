const express = require("express");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const protect = require("../middleware/auth");

const router = express.Router();

router.use(protect);

// Overall summary KPI metrics
router.get("/summary", async (req, res) => {
  try {
    const [
      totalProducts,
      totalCustomers,
      totalOrders,
      lowStockCount,
      revenueResult,
      statusResult,
      unitsResult,
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
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        { $group: { _id: null, units: { $sum: "$items.quantity" } } },
      ]),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].revenue : 0;
    const totalUnitsSold = unitsResult.length > 0 ? unitsResult[0].units : 0;

    const ordersByStatus = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
    statusResult.forEach((s) => {
      ordersByStatus[s._id] = s.count;
    });

    const activeOrders = ordersByStatus.pending + ordersByStatus.shipped + ordersByStatus.delivered;
    const averageOrderValue = activeOrders > 0 ? Math.round(totalRevenue / activeOrders) : 0;

    res.json({
      totalProducts,
      totalCustomers,
      totalOrders,
      lowStockCount,
      totalRevenue,
      totalUnitsSold,
      averageOrderValue,
      ordersByStatus,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Best-selling products (supports sortBy=units|revenue, limit, and optional date/days filter)
router.get("/top-products", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);
    const sortBy = req.query.sortBy === "revenue" ? "revenue" : "unitsSold";
    const days = req.query.days ? Number(req.query.days) : null;
    const { startDate, endDate } = req.query;

    const matchStage = { status: { $ne: "cancelled" } };

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: s, $lte: e };
    } else if (days && days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days + 1);
      since.setHours(0, 0, 0, 0);
      matchStage.createdAt = { $gte: since };
    }

    const result = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { [sortBy]: -1 } },
      { $limit: limit },
      { $project: { _id: 0, productId: "$_id", name: 1, unitsSold: 1, revenue: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Sales for each day within a given time period or custom date range
router.get("/sales-by-day", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = { status: { $ne: "cancelled" } };

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: s, $lte: e };
    } else {
      let days = req.query.days === "all" ? 365 : Number(req.query.days) || 7;
      days = Math.min(Math.max(days, 1), 730);
      const since = new Date();
      since.setDate(since.getDate() - days + 1);
      since.setHours(0, 0, 0, 0);
      matchStage.createdAt = { $gte: since };
    }

    const result = await Order.aggregate([
      { $match: matchStage },
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

// Sales & units breakdown by product category
router.get("/category-sales", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const days = req.query.days ? Number(req.query.days) : null;
    let matchStage = { status: { $ne: "cancelled" } };

    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      matchStage.createdAt = { $gte: s, $lte: e };
    } else if (days && days > 0) {
      const since = new Date();
      since.setDate(since.getDate() - days + 1);
      since.setHours(0, 0, 0, 0);
      matchStage.createdAt = { $gte: since };
    }

    const result = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$productInfo.category", "General"] },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          ordersCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $project: { _id: 0, category: "$_id", unitsSold: 1, revenue: 1, ordersCount: 1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Top customers by total spend
router.get("/top-customers", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 50);
    const result = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$customerName",
          email: { $first: "$customerEmail" },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          customerName: "$_id",
          email: 1,
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
