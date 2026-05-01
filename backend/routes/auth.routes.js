
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

/**
 * =====================================================
 * 🔐 AUTH ROUTES (LOGIN / REGISTER)
 * =====================================================
 */

/**
 * 🧾 REGISTER USER
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, email, hash]
    );

    const user = result.rows[0];
    delete user.password;

    res.status(201).json({
      success: true,
      user
    });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔑 LOGIN USER
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRes = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (!userRes.rows.length) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = userRes.rows[0];

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password;

    res.json({
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
