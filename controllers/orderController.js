const Order = require('../models/order');
const Medicine = require('../models/medicine'); // এই ফাইলটি এখানে প্রয়োজন হতে পারে যদি createOrder-এ স্টক চেক করেন

// 🧾 Place a new order
// দ্রষ্টব্য: এই ফাংশনটি সরাসরি ব্যবহার না করে cartController-এর checkout ব্যবহার করা ভালো
// কারণ checkout ফাংশনে স্টক কমানোর লজিক আছে।
exports.createOrder = async (req, res) => {
  try {
    const { medicineId, quantity, paymentMethod } = req.body;

    // improvement: এখানেও স্টক চেক এবং priceAtOrder যোগ করা উচিত
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return res.status(404).json({ message: "Medicine not found" });
    if (medicine.stock < quantity) return res.status(400).json({ message: "Not enough stock" });

    const newOrder = new Order({
      userId: req.user.userId,
      medicineId,
      quantity,
      priceAtOrder: medicine.price, // দাম সেভ করা
      paymentMethod,
      status: paymentMethod === 'COD' ? 'COD' : 'Pending',
    });

    // স্টক কমানো (যদি পেমেন্ট মেথড COD হয়)
    if (paymentMethod === 'COD') {
      medicine.stock -= quantity;
      await medicine.save();
    }

    await newOrder.save();
    res.status(201).json({
      message: 'Order placed successfully ✅',
      order: newOrder,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};


// improvement: ইউজারের অর্ডারের ইতিহাস (Order History)
exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await Order.find({
      userId: userId,
      status: { $ne: 'Pending' } // 'Pending' স্ট্যাটাস বাদে (কার্ট বাদে)
    })
    .populate('medicineId', 'name price image') // মেডিসিনের তথ্য লোড করা
    .sort({ createdAt: -1 }); // নতুন অর্ডার আগে দেখানো

    res.json({
      message: "Order history fetched successfully",
      orders,
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Error fetching order history', error: error.message });
  }
};