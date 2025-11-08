const multer = require("multer");
const path = require("path");

// স্টোরেজ সেটআপ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // "uploads" ফোল্ডারে ফাইল যাবে
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// শুধুমাত্র ইমেজ ফাইল অনুমোদিত
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, jpeg, png, webp) are allowed!"), false);
  }
};

const upload = multer({ storage, fileFilter });
module.exports = upload;
