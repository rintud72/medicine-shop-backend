const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const adminAuth = require("../middleware/adminAuth");
const {
  getAllUsers,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");

// 👑 Admin Protected Routes
router.get("/users", authenticateToken, adminAuth, getAllUsers);
router.delete("/users/:id", authenticateToken, adminAuth, deleteUser);

router.get("/orders", authenticateToken, adminAuth, getAllOrders);
router.put("/orders/:id", authenticateToken, adminAuth, updateOrderStatus);

module.exports = router;
