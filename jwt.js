const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

// 🔐 GENERATE TOKEN
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    SECRET,
    { expiresIn: '1d' }
  );
};

// 🔍 VERIFY TOKEN
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};