
const jwt = require("jsonwebtoken");

/**
 * =====================================================
 * 🔐 AUTH MIDDLEWARE (USER VERIFICATION)
 * =====================================================
 */

module.exports = function (req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // user info inside token

    next();

  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};