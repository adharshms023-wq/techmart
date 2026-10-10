require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", require("./routes/auth"));

app.get("/health", (req, res) => {
  res.send("TechMart server is running");
});

const protect = require("./middleware/auth");

app.get("/api/me", protect, (req, res) => {
  res.json({ message: "You are logged in", adminId: req.adminId });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server started on port " + PORT));
  })
  .catch((err) => console.log("Database error:", err.message));
  app.use("/api/products", require("./routes/products"));
  app.use("/api/orders", require("./routes/orders"));
  app.use("/api/customers", require("./routes/customers"));
  app.use("/api/notifications", require("./routes/notifications"));
  app.use("/api/reports", require("./routes/reports"));