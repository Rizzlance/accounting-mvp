const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');


// ======================
// 🔐 REGISTER
// ======================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ VALIDATION
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // 🔍 CHECK EXISTING USER
    const existing = await User.findByEmail(email);

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 🔐 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // 👤 CREATE USER
    const result = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const user = result.rows[0];

    // 🎟️ GENERATE TOKEN
    const token = generateToken(user);

    res.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {
    console.error('REGISTER ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});


// ======================
// 🔐 LOGIN
// ======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ VALIDATION
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // 🔍 FIND USER
    const result = await User.findByEmail(email);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // 🔐 CHECK PASSWORD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 🎟️ GENERATE TOKEN
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;