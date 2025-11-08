const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadImage"); // improvement: কোড পুনরাবৃত্তি না করে মিডলওয়্যার থেকে import করা
const {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
} = require("../controllers/medicineController");

// 🖼️ Multer setup for image upload
// improvement: নিচের কোডটি সরিয়ে ফেলা হয়েছে কারণ এটি 'middleware/uploadImage.js'-এ আছে
/*
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
*/

// ✅ Routes
router.post("/", upload.single("image"), addMedicine);
router.get("/", getMedicines);
router.get("/:id", getMedicineById);
router.put("/:id", upload.single("image"), updateMedicine);
router.delete("/:id", deleteMedicine);

module.exports = router;