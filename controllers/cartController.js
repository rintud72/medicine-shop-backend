// medicine-shop/controllers/cartController.js

const User = require('../models/user');
const Medicine = require('../models/medicine');
const Order = require('../models/order'); 

// ✅ GET /api/cart
// ইউজার লগড ইন থাকলে তার কার্ট (Pending Orders) দেখাবে
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItems = await Order.find({ userId, status: 'Pending' })
      .populate('medicineId', 'name price image'); // মেডিসিনের ডিটেলস সহ

    res.json({ cart: { items: cartItems } });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
};

// ✅ POST /api/cart/add
// কার্টে নতুন আইটেম যোগ করা
exports.addToCart = async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    const userId = req.user.userId;

    // improvement: মেডিসিন এবং স্টক চেক
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // চেক করা হচ্ছে এই আইটেমটি আগে থেকেই কার্টে আছে কিনা
    let existingCartItem = await Order.findOne({
      userId,
      medicineId,
      status: 'Pending',
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      // improvement: স্টক ভ্যালিডেশন
      if (medicine.stock < newQuantity) {
        return res.status(400).json({ message: `Not enough stock. Only ${medicine.stock} left.` });
      }
      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      res.json({ message: 'Item quantity updated in cart', order: existingCartItem });
    } else {
      // improvement: স্টক ভ্যালিডেশন
      if (medicine.stock < quantity) {
        return res.status(400).json({ message: `Not enough stock. Only ${medicine.stock} left.` });
      }
      // যদি না থাকে, নতুন Order (কার্ট আইটেম) তৈরি করা হচ্ছে
      const newCartItem = new Order({
        userId,
        medicineId,
        quantity,
        priceAtOrder: medicine.price, // improvement: অর্ডারের সময় দাম সেভ করা
        status: 'Pending', // ডিফল্ট স্ট্যাটাস
      });
      await newCartItem.save();
      res.status(201).json({ message: 'Item added to cart', order: newCartItem });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
};

// ✅ DELETE /api/cart/remove/:id
// কার্ট থেকে আইটেম ডিলিট করা
exports.removeFromCart = async (req, res) => {
  try {
    const medicineId = req.params.id; // URL থেকে medicineId
    const userId = req.user.userId;

    const result = await Order.deleteOne({
      userId,
      medicineId,
      status: 'Pending',
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
};

// ✅ POST /api/cart/checkout
// কার্টের সব আইটেমকে "COD" বা "Paid" তে কনভার্ট করা
exports.checkout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const paymentMethod = 'COD'; // COD checkout

    const cartItems = await Order.find({ userId, status: 'Pending' });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty!' });
    }

    // improvement: প্রতিটি আইটেমের জন্য স্টক চেক এবং কমানো
    for (const item of cartItems) {
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({ message: `Medicine ID ${item.medicineId} not found.` });
      }
      if (medicine.stock < item.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${medicine.name}. Only ${medicine.stock} left.` });
      }
      
      // স্টক কমানো
      medicine.stock -= item.quantity;
      await medicine.save();

      // অর্ডারের স্ট্যাটাস আপডেট
      item.status = paymentMethod;
      await item.save();
    }

    res.json({ message: 'Checkout successful! Order placed.' });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Error during checkout' });
  }
};