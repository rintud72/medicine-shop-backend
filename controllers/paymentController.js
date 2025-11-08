const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order');
const Medicine = require('../models/medicine');

// ✅ Razorpay instance safely initialize
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized successfully.');
} else {
  console.warn('⚠️ Razorpay keys missing. Payment features will be disabled.');
}

// ✅ Create Razorpay order (handles full cart)
exports.createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please try Cash on Delivery.',
      });
    }

    const userId = req.user.userId;
    const cartItems = await Order.find({ userId, status: 'Pending' }).populate('medicineId', 'price');

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    let totalAmount = 0;
    for (const item of cartItems) {
      if (!item.medicineId) {
        return res.status(404).json({
          message: `Medicine ID ${item.medicineId} not found in cart. Please remove it.`,
        });
      }
      totalAmount += item.priceAtOrder * item.quantity;
    }

    const options = {
      amount: totalAmount * 100, // convert to paisa
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await Order.updateMany(
      { userId, status: 'Pending' },
      { $set: { paymentId: order.id } }
    );

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      userName: req.user.name,
      userEmail: req.user.email,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Error creating Razorpay order' });
  }
};

// ✅ Verify Razorpay payment (manages stock)
exports.verifyPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please try Cash on Delivery.',
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.userId;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const paidItems = await Order.find({ userId, paymentId: razorpay_order_id, status: 'Pending' });

      if (paidItems.length === 0) {
        return res.status(400).json({ success: false, message: 'No pending orders found for this payment.' });
      }

      for (const item of paidItems) {
        const medicine = await Medicine.findById(item.medicineId);
        if (!medicine || medicine.stock < item.quantity) {
          item.status = 'Failed';
          await item.save();
          return res.status(400).json({
            success: false,
            message: `Stock issue for ${medicine?.name}. Order marked as Failed.`,
          });
        }

        medicine.stock -= item.quantity;
        await medicine.save();

        item.status = 'Paid';
        item.paymentMethod = 'ONLINE';
        await item.save();
      }

      res.json({ success: true, message: 'Payment verified successfully ✅' });
    } else {
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
