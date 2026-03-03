const mongoose = require("mongoose");

const productionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  shift: {
    type: String,
    enum: ["Day", "Night"],
  },
  openingStock: Number,
  productionQty: Number,
  closingStock: Number,
}, { timestamps: true });

module.exports = mongoose.model("Production", productionSchema);