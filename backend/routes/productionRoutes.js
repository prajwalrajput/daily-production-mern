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

    const productionQtyNumber = Number(productionQty);
    if (isNaN(productionQtyNumber)) {
      return res.status(400).json({ message: "Invalid production quantity" });
    }

    // Date range for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing record for same date + shift
    const existing = await Production.findOne({
      date: { $gte: startOfDay, $lte: endOfDay },
      shift: shift,
    });

    // Get last record before this entry for opening stock
    const lastRecord = await Production.findOne({ date: { $lt: startOfDay } }).sort({ date: -1, createdAt: -1 });
    let openingStock = lastRecord ? lastRecord.closingStock : 0;
    let closingStock = openingStock + productionQtyNumber;

    if (existing) {
      // UPDATE existing record
      existing.productionQty = productionQtyNumber;
      existing.openingStock = openingStock;
      existing.closingStock = closingStock;
      await existing.save();
    } else {
      // CREATE new record
      const newEntry = new Production({
        date,
        shift,
        openingStock,
        productionQty: productionQtyNumber,
        closingStock,
      });
      await newEntry.save();
    }

    // Update all subsequent records
    const subsequentRecords = await Production.find({ date: { $gt: startOfDay } }).sort({ date: 1, createdAt: 1 });
    let prevClosing = closingStock;

    for (let record of subsequentRecords) {
      record.openingStock = prevClosing;
      record.closingStock = prevClosing + record.productionQty;
      prevClosing = record.closingStock;
      await record.save();
    }

    res.json({ message: existing ? "Record Updated and Subsequent Stocks Adjusted" : "Record Created and Subsequent Stocks Adjusted" });

  } catch (error) {
    console.error("Error saving production:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get All Records
router.get("/", async (req, res) => {
  try {
    const records = await Production.find().sort({ date: 1, shift: 1, createdAt: 1 });
    res.json(records);
  } catch (error) {
    console.error("Error fetching production:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
