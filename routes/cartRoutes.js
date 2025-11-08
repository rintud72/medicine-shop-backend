// medicine-shop/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const {
  getCartItems,
  addToCart,
  removeFromCart,
  checkout
} = require('../controllers/cartController');

// এই রুটগুলো আপনার vite.config.js এর rewrite রুলের সাথে মিলে যাবে

// GET /api/cart (Vite থেকে /api/orders/cart এখানে আসবে)
router.get('/', authenticateToken, getCartItems);

// POST /api/cart/add (Vite থেকে /api/orders/add-to-cart এখানে আসবে)
router.post('/add', authenticateToken, addToCart);

// DELETE /api/cart/remove/:id (Vite থেকে /api/orders/remove-from-cart/:id এখানে আসবে)
router.delete('/remove/:id', authenticateToken, removeFromCart);

// POST /api/cart/checkout (Vite থেকে /api/orders/checkout এখানে আসবে)
router.post('/checkout', authenticateToken, checkout);


// ... আপনার অন্য রুটগুলো ...

// ✅ ডিবাগিং-এর জন্য নতুন টেস্ট রুট
router.get('/test', (req, res) => {
  console.log("✅✅✅ TEST ROUTE HIT ✅✅✅");
  res.send('Cart routes file is working!');
});

module.exports = router;
