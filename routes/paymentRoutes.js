const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { createRazorpayOrder, verifyPayment } = require('../controllers/paymentController');

// 🧾 Create Razorpay order
router.post('/create-order', authenticateToken, createRazorpayOrder);

// 💳 Verify payment
router.post('/verify-payment', authenticateToken, verifyPayment);

module.exports = router;
