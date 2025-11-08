const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneOtp: { type: String },              // ✅ OTP সংরক্ষণের field
  otpExpiresAt: { type: Date },            // ✅ OTP মেয়াদ শেষ হওয়ার সময়
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' }
});

// 🔒 Password hash করার আগে middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔐 Password match helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log('enteredPassword:', enteredPassword);
  console.log('db password:', this.password);
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', userSchema);
