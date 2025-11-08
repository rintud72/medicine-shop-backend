const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateOTP = require('../utils/otpgenerator');
const sendEmail = require('../utils/sendEmail'); // improvement: সেন্ট্রাল ইমেইল ফাংশন

// =======================
// 🧾 REGISTER USER + SEND OTP
// =======================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate OTP (6 digits) valid for 10 minutes
    const otp = generateOTP(6);
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    const newUser = new User({
      name,
      email,
      password,
      phoneOtp: otp,
      otpExpiresAt: otpExpiry,
      isVerified: false,
    });

    await newUser.save();
    console.log("TEST OTP:", otp);
    // improvement: সেন্ট্রাল ইমেইল ফাংশন ব্যবহার
    const subject = 'OTP Verification - Medicine Shop';
    const text = `Hello ${name},\n\nYour OTP for verification is: ${otp}\nThis OTP will expire in 10 minutes.\n\n- Medicine Shop`;
    await sendEmail(email, subject, text);

    res.status(201).json({ message: 'OTP sent to your email. Please verify your account.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};


// =======================
// 🔐 VERIFY OTP
// =======================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.json({ message: 'User already verified' });
    if (user.phoneOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > user.otpExpiresAt) return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.phoneOtp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ message: 'User verified successfully ✅' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};


// =======================
// 🔓 LOGIN USER
// =======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Select password field manually
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // Must be verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please verify OTP first.' });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful ✅',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};


// =======================
// 🔁 FORGOT PASSWORD (SEND OTP)
// =======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP(6);
    user.phoneOtp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    // improvement: সেন্ট্রাল ইমেইল ফাংশন ব্যবহার
    const subject = 'Reset Password OTP - Medicine Shop';
    const text = `Your OTP for resetting password is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, text);

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (error)
 {
    console.error('Error sending reset OTP:', error);
    res.status(500).json({ message: 'Error sending reset OTP', error: error.message });
  }
};


// =======================
// 🔐 VERIFY RESET OTP
// =======================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.phoneOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > user.otpExpiresAt) return res.status(400).json({ message: 'OTP expired' });

    // improvement: OTP ভেরিফাই হলে তা null করে দেওয়া উচিত, তবে resetPassword-এও এটি চেক করা ভালো।
    // আপাতত শুধু ভেরিফাই করা হলো।
    res.json({ message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    res.status(500).json({ message: 'Error verifying reset OTP', error: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body; // improvement: OTP-ও চেক করা উচিত
    console.log("🔁 Reset Password called for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // improvement: রিসেট করার আগে OTP আবার ভেরিফাই করা ভালো
    if (user.phoneOtp !== otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // improvement: user.save() ব্যবহার করা হচ্ছে যাতে pre('save') হুকটি কাজ করে
    user.password = newPassword;
    user.phoneOtp = null;
    user.otpExpiresAt = null;
    
    const updatedUser = await user.save(); // এটি pre('save') হুক ট্রিগার করবে

    console.log("✅ Password reset for", email);
    console.log("🔒 New hash:", updatedUser.password);

    res.json({ message: "Password reset successfully ✅ You can now log in with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};




// =======================
// 👤 Get Logged-in User Profile
// =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // JWT থেকে পাওয়া userId

    const user = await User.findById(userId).select("-password -phoneOtp -otpExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

// =======================
// ✏️ Update User Profile
// =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password -phoneOtp -otpExpiresAt");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully ✅", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};


// improvement: নিচের ডুপ্লিকেট ফাংশনগুলো মুছে ফেলা হয়েছে।