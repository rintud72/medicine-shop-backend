const Medicine = require("../models/medicine");

// ✅ Add Medicine (with image)
exports.addMedicine = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !description || !stock) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newMedicine = new Medicine({
      name,
      price,
      description,
      stock,
      image,
    });

    await newMedicine.save();
    res.status(201).json({
      message: "Medicine added successfully ✅",
      medicine: newMedicine,
    });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ message: "Failed to add medicine", error: error.message });
  }
};

// ✅ Get Medicines with Pagination AND SEARCH
exports.getMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = 8; // Medicines per page
    const skip = (page - 1) * limit;

    // improvement: সার্চ ফাংশন
    const searchQuery = req.query.search || "";
    const filter = {};

    if (searchQuery) {
      // যদি সার্চ টার্ম থাকে, তাহলে 'name' ফিল্ডে case-insensitive regex সার্চ
      filter.name = { $regex: searchQuery, $options: 'i' };
    }
    // END: সার্চ ফাংশন

    const total = await Medicine.countDocuments(filter);
    const medicines = await Medicine.find(filter).skip(skip).limit(limit);

    res.json({
      medicines,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Server error fetching medicines" });
  }
};

// ✅ Get Single Medicine by ID
exports.getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    res.json(medicine);
  } catch (error) {
    console.error("Error fetching single medicine:", error);
    res.status(500).json({ message: "Failed to fetch medicine" });
  }
};

// ✅ Update Medicine (with optional new image)
exports.updateMedicine = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateFields = { name, price, description, stock };
    if (image) updateFields.image = image;

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({
      message: "Medicine updated successfully ✅",
      medicine: updatedMedicine,
    });
  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ message: "Failed to update medicine", error: error.message });
  }
};

// ✅ Delete Medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const deletedMedicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!deletedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({ message: "Medicine deleted successfully 🗑️" });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ message: "Failed to delete medicine" });
  }
};