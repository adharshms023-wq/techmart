const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const protect = require("../middleware/auth");

const router = express.Router();

// Universal login: supports both admin and customer login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // If role is specifically 'customer':
    if (role === "customer") {
      const customer = await Customer.findOne({ email: trimmedEmail });
      if (!customer) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // If customer has a set password, verify it; otherwise support default 'Customer@123'
      let match = false;
      if (customer.password) {
        match = await bcrypt.compare(password, customer.password);
      } else {
        match = password === "Customer@123";
      }

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: customer._id, role: "customer", email: customer.email, name: customer.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        token,
        role: "customer",
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }

    // Check Admin
    const admin = await Admin.findOne({ email: trimmedEmail });
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (match) {
        const token = jwt.sign(
          { id: admin._id, role: "admin", email: admin.email, name: admin.name },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );
        return res.json({ token, role: "admin", name: admin.name, email: admin.email });
      }
    }

    // If role was not specified and admin didn't match, check Customer as fallback
    if (!role) {
      const customer = await Customer.findOne({ email: trimmedEmail });
      if (customer) {
        let match = false;
        if (customer.password) {
          match = await bcrypt.compare(password, customer.password);
        } else {
          match = password === "Customer@123";
        }

        if (match) {
          const token = jwt.sign(
            { id: customer._id, role: "customer", email: customer.email, name: customer.name },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          return res.json({
            token,
            role: "customer",
            name: customer.name,
            email: customer.email,
            phone: customer.phone || "",
            address: customer.address || "",
          });
        }
      }
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Customer registration
router.post("/customer-register", async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const exists = await Customer.findOne({ email: trimmedEmail });
    if (exists) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : "",
      address: address ? address.trim() : "",
    });

    const token = jwt.sign(
      { id: customer._id, role: "customer", email: customer.email, name: customer.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      role: "customer",
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Registration failed" });
  }
});

// Verify current session
router.get("/me", protect, async (req, res) => {
  try {
    if (req.userRole === "admin") {
      const admin = await Admin.findById(req.adminId).select("-password");
      return res.json({ role: "admin", user: admin });
    } else {
      const customer = await Customer.findById(req.customerId).select("-password");
      return res.json({ role: "customer", user: customer });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
