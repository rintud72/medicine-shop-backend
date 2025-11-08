const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  quantity: { type: Number, required: true },
  
  // improvement: অর্ডার করার সময়কার প্রতি ইউনিটের দাম
  priceAtOrder: { type: Number, required: true }, 

  // ✅ COD or ONLINE
  paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },

  // ✅ Order status
  status: { type: String, enum: ['Pending', 'Paid', 'COD', 'Failed'], default: 'Pending' },

  // ✅ Payment info for online
  paymentId: { type: String },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);