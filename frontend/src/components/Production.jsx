import React, { useState } from "react";
import API from "../api";
import * as XLSX from "xlsx-js-style";
import ProductionChart from "./ProductionChart";
import "./production.css";


export default function Production() {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    shift: "Day",
    productionQty: "",
  });

  const [flash, setFlash] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addEntry = async () => {
    if (!form.productionQty) return;

    try {
      await API.post("/production", form);

      setFlash("Entry Saved Successfully ✅");
      setForm({ ...form, productionQty: "" });

      setTimeout(() => {
        setFlash("");
      }, 3000);
    } catch (error) {
      setFlash("Error saving entry ❌");
      setTimeout(() => {
        setFlash("");
      }, 3000);
    }
  };

  const downloadExcel = async () => {
  try {
    const res = await API.get("/production");
    const records = res.data.reverse();
    console.log("API Data:", res.data);

    let totalProduction = 0;

    const formattedData = records.map((r) => {
      totalProduction += Number(r.productionQty);
      return [
        new Date(r.date).toLocaleDateString(),
        r.shift,
        r.openingStock,
        r.productionQty,
        r.closingStock,
      ];
    });

    // Add empty row
    formattedData.push([]);

    // Add TOTAL row
    formattedData.push([
      "",
      "TOTAL",
      "",
      totalProduction,
      "",
    ]);

    const header = [
      "Date",
      "Shift",
      "Opening Stock",
      "Production Qty",
      "Closing Stock",
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, ...formattedData]);

    const range = XLSX.utils.decode_range(ws["!ref"]);

    // 🔵 Header Styling
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "007BFF" } },
        alignment: { horizontal: "center" },
      };
    }

    // 🟢 TOTAL Row Styling
    const totalRowIndex = range.e.r;
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cell = ws[XLSX.utils.encode_cell({ r: totalRowIndex, c: col })];
      if (cell) {
        cell.s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "C6EFCE" } },
        };
      }
    }

    // Auto column width
    ws["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Report");

    XLSX.writeFile(wb, "Stock_Report.xlsx");

  } catch (error) {
    setFlash("Error downloading Excel ❌");
    setTimeout(() => setFlash(""), 3000);
  }

  

};

  return (
  <div className="production-container">

    <div className="production-card">
      <h2 className="production-title">Stock Management</h2>

      {flash && (
        <div className="flash-message">
          {flash}
        </div>
      )}

      <div className="form-grid">
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="production-input"
        />

        <select
          name="shift"
          value={form.shift}
          onChange={handleChange}
          className="production-input"
        >
          <option value="Day">Day</option>
          <option value="Night">Night</option>
        </select>

        <input
          type="number"
          name="productionQty"
          placeholder="Production Quantity"
          value={form.productionQty}
          onChange={handleChange}
          className="production-input"
        />
      </div>

      <div className="button-group">
        <button className="btn btn-save" onClick={addEntry}>
          Save Entry
        </button>

        <button className="btn btn-download" onClick={downloadExcel}>
          Download Excel
        </button>
      </div>
    </div>

    <div className="production-card chart-section">
      <ProductionChart />
    </div>

  </div>
);
}
