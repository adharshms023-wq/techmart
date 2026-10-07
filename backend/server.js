require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/health", (req, res) => {
  res.send("TechMart server is running");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log("Server started on port " + PORT));
  })
  .catch((err) => console.log("Database error:", err.message));