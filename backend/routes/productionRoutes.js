// routes/production.js
const express = require("express");
const router = express.Router();
const Production = require("../models/Production");

// Add or Update Production Entry
router.post("/", async (req, res) => {
  try {
    const { date, shift, productionQty } = req.body;

    // Validate required fields
    if (!date || !shift || productionQty === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert productionQty to Number safely
    const productionQtyNumber = Number(productionQty);
    if (isNaN(productionQtyNumber)) {
      return res.status(400).json({ message: "Invalid production quantity" });
    }

    // Calculate date range for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing record for same date + shift
    const existing = await Production.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift,
    });

    // Get last record for stock calculation
    const lastRecord = await Production.findOne().sort({ createdAt: -1 });
    const openingStock = lastRecord ? lastRecord.closingStock : 0;
    const closingStock = openingStock + productionQtyNumber;

    if (existing) {
      // UPDATE
      existing.productionQty = productionQtyNumber;
      existing.closingStock = closingStock;
      await existing.save();
      return res.json({ message: "Record Updated" });
    }

    // CREATE NEW
    const newEntry = new Production({
      date,
      shift,
      openingStock,
      productionQty: productionQtyNumber,
      closingStock,
    });

    await newEntry.save();
    res.json({ message: "Record Created" });

  } catch (error) {
    console.error("Error saving production:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get All Records
router.get("/", async (req, res) => {
  try {
    const records = await Production.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error("Error fetching production:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;