const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { createOrder, getOrderHistory } = require('../controllers/orderController'); // getOrderHistory যোগ করা

// improvement: ইউজারের অর্ডারের ইতিহাসের জন্য নতুন রুট
// GET /api/orders/my-history
router.get('/my-history', authenticateToken, getOrderHistory);

// POST /api/orders/
router.post('/', authenticateToken, createOrder);


module.exports = router;