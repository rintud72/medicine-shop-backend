const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');


const {
  registerUser,
  loginUser,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  updateProfile
} = require('../controllers/userController');

// Registration + Login + OTP verify
router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);

// Forgot Password flow
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);


// 👤 User Profile Routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);


module.exports = router;

