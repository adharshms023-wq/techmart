const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userRole = decoded.role || (decoded.adminId || decoded.id ? "admin" : "customer");
    req.adminId = req.userRole === "admin" ? (decoded.id || decoded.adminId) : null;
    req.customerId = req.userRole === "customer" ? (decoded.id || decoded.customerId) : null;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userRole = decoded.role || "admin";
    req.adminId = req.userRole === "admin" ? (decoded.id || decoded.adminId) : null;
    req.customerId = req.userRole === "customer" ? (decoded.id || decoded.customerId) : null;
  } catch (err) {
    // Ignore invalid token for optional auth
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Access forbidden: admin privileges required" });
  }
  next();
}

protect.protect = protect;
protect.optional = optionalAuth;
protect.requireAdmin = requireAdmin;

module.exports = protect;
