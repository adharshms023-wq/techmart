require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const protect = require("./middleware/auth");

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("TechMart server is running");
});

// Public – no token needed
app.use("/api/auth", require("./routes/auth"));

// products & orders: optional auth — guests can browse/checkout,
// but write-ops inside each router still enforce requireAdmin
app.use("/api/products",      protect.optional, require("./routes/products"));
app.use("/api/orders",        protect.optional, require("./routes/orders"));
app.use("/api/customers",     protect, require("./routes/customers"));
app.use("/api/notifications", protect, require("./routes/notifications"));
app.use("/api/reports",       protect, require("./routes/reports"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server started on port " + PORT));
  })
  .catch((err) => console.log("Database error:", err.message));
