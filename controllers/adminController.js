const User = require("../models/user");
const Order = require("../models/order");
const Medicine = require("../models/medicine");

// =========================
// 👥 Get all users
// =========================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -phoneOtp -otpExpiresAt");
    res.json({ total: users.length, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// =========================
// ❌ Delete user by ID
// =========================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully 🗑️" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// =========================
// 📦 Get all orders
// =========================
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("medicineId", "name price");
    res.json({ total: orders.length, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

// =========================
// 🔁 Update order status
// =========================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("userId", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order status updated ✅", order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error: error.message });
  }
};
