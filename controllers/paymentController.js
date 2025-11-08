const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order');
const Medicine = require('../models/medicine'); // 1. Medicine মডেল ইমপোর্ট করুন

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Create Razorpay order (আপডেটেড: এখন এটি সম্পূর্ণ কার্ট হ্যান্ডেল করে)
exports.createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // 2. ইউজারের কার্টে থাকা সব 'Pending' আইটেম খুঁজুন
    const cartItems = await Order.find({ userId, status: 'Pending' }).populate('medicineId', 'price');

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // 3. মোট দাম গণনা করুন
    let totalAmount = 0;
    for (const item of cartItems) {
      if (!item.medicineId) {
         return res.status(404).json({ message: `Medicine ID ${item.medicineId} not found in cart. Please remove it.` });
      }
      // priceAtOrder ব্যবহার করুন, কারণ দাম সেভ করা আছে
      totalAmount += item.priceAtOrder * item.quantity;
    }

    const options = {
      amount: totalAmount * 100, // পয়সাতে কনভার্ট
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    // 4. Razorpay অর্ডার তৈরি করুন
    const order = await razorpay.orders.create(options);

    // 5. এই Razorpay orderId-টি কার্টের সব 'Pending' আইটেমে সেভ করুন
    // এটি verifyPayment-কে সাহায্য করবে
    await Order.updateMany(
      { userId, status: 'Pending' },
      { $set: { paymentId: order.id } } // paymentId ফিল্ডটি আমরা Razorpay order_id রাখার জন্য ব্যবহার করছি
    );

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // 6. Key_ID ফ্রন্টএন্ডে পাঠান
      userName: req.user.name, // 7. ইউজার ডিটেইলস পাঠান
      userEmail: req.user.email
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Error creating Razorpay order' });
  }
};

// ✅ Verify Razorpay payment (আপডেটেড: এখন এটি স্টক ম্যানেজ করে)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.userId;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // 8. সিগনেচার ভেরিফাই
    if (expectedSignature === razorpay_signature) {
      // পেমেন্ট সফল!
      
      // 9. সব 'Pending' আইটেম খুঁজুন যা এই paymentId (razorpay_order_id) ব্যবহার করেছে
      const paidItems = await Order.find({ userId, paymentId: razorpay_order_id, status: 'Pending' });

      if (paidItems.length === 0) {
        return res.status(400).json({ success: false, message: 'No pending orders found for this payment.' });
      }

      // 10. স্টক কমানো এবং স্ট্যাটাস 'Paid'-এ আপডেট করা
      for (const item of paidItems) {
        const medicine = await Medicine.findById(item.medicineId);
        if (!medicine || medicine.stock < item.quantity) {
          // স্টক না থাকলে, অর্ডার 'Failed' মার্ক করুন
          item.status = 'Failed';
          await item.save();
          // এখানে এডমিনকে নোটিফাই করার লজিক যোগ করা যেতে পারে
          return res.status(400).json({ success: false, message: `Stock issue for ${medicine?.name}. Order marked as Failed.` });
        }

        // স্টক কমানো
        medicine.stock -= item.quantity;
        await medicine.save();

        // অর্ডার স্ট্যাটাস 'Paid'-এ আপডেট
        item.status = 'Paid';
        item.paymentMethod = 'ONLINE';
        await item.save();
      }

      res.json({ success: true, message: 'Payment verified successfully ✅' });
    } else {
      // সিগনেচার মিলল না
      // সব 'Pending' আইটেমকে 'Failed'-এ আপডেট করুন
      await Order.updateMany(
        { userId, paymentId: razorpay_order_id, status: 'Pending' },
        { $set: { status: 'Failed' } }
      );
      res.status(400).json({ success: false, message: 'Invalid payment signature ❌' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
};