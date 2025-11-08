require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet'); // 1. helmet import করা আছে
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require("./routes/adminRoutes");
const path = require("path"); 
const cartRoutes = require('./routes/cartRoutes'); 

// ✅ Middleware

// improvement: helmet-কে কনফিগার করা যাতে ছবি লোড হয়
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" } // 2. এই লাইনটি ছবি অ্যালাউ করবে
  })
);


// ✅ CORS configuration
const cors = require("cors");
app.use(cors({
  origin: "http://localhost:5173", // frontend port
  credentials: true
}));

// ✅ Middleware (বাকিগুলো)
app.use(bodyParser.json());
app.use(express.json());



// ✅ Routes
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/cart', cartRoutes); 
// ✅ Serve uploaded images publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// ✅ MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));