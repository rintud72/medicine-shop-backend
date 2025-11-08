const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Authorization হেডার থেকে টোকেন নেয়া
  const authHeader = req.headers['authorization'];
  // "Bearer TOKEN" ফরম্যাটে থাকলে split করে টোকেনটা নিচ্ছি
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // টোকেন ভেরিফাই হলে ইউজার ডাটা রিকোয়েস্টে সংরক্ষণ করলাম
    next(); // পরবর্তী middleware বা route handler এ যাবে
  });
}

module.exports = authenticateToken;
