function adminAuth(req, res, next) {
  const user = req.user; // Assume user object comes from JWT

  if (user && user.role === 'ADMIN') {
    next(); // Continue if the user is an admin
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required.' });
  }
}

module.exports = adminAuth;
