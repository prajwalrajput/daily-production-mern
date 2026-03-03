import React, { useEffect, useState, useMemo } from "react";
import API from "../api";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ProductionChart() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await API.get("/production");
      setRecords(res.data.reverse());
    };
    fetchData();
  }, []);

  // ===============================
  // 🏎️ Efficient Data Processing
  // ===============================
  const {
    monthlyChart,
    overallTrend,
    dailyStacked,
    pieData,
    closingStockTrend,
  } = useMemo(() => {
    const monthlyData = {};
    const lastThreeMonthsGrouped = {};
    let totalDay = 0;
    let totalNight = 0;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const overallLabels = [];
    const overallData = [];
    const closingStockData = [];

    records.forEach((r) => {
      const qty = Number(r.productionQty) || 0;
      const closing = Number(r.closingStock) || 0;
      const dateObj = new Date(r.date);
      const dateStr = dateObj.toLocaleDateString();

      // 1️⃣ Overall Trend
      overallLabels.push(dateStr);
      overallData.push(qty);

      // 2️⃣ Closing Stock Trend
      closingStockData.push(closing);

      // 3️⃣ Monthly Data
      const month = dateObj.toLocaleString("default", { month: "short", year: "numeric" });
      monthlyData[month] = (monthlyData[month] || 0) + qty;

      // 4️⃣ Last 3 months daily stacked
      if (dateObj >= threeMonthsAgo) {
        if (!lastThreeMonthsGrouped[dateStr]) lastThreeMonthsGrouped[dateStr] = { Day: 0, Night: 0 };
        lastThreeMonthsGrouped[dateStr][r.shift] += qty;
      }

      // 5️⃣ Day/Night totals
      if (r.shift === "Day") totalDay += qty;
      else totalNight += qty;
    });

    const dates = Object.keys(lastThreeMonthsGrouped);

    return {
      monthlyChart: {
        labels: Object.keys(monthlyData),
        datasets: [
          {
            label: "Monthly Production",
            data: Object.values(monthlyData),
            backgroundColor: "rgba(54, 162, 235, 0.7)",
          },
        ],
      },
      overallTrend: {
        labels: overallLabels,
        datasets: [
          {
            label: "Production Trend",
            data: overallData,
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      dailyStacked: {
        labels: dates,
        datasets: [
          {
            label: "Day",
            data: dates.map((d) => lastThreeMonthsGrouped[d].Day),
            backgroundColor: "rgba(54, 162, 235, 0.8)",
            stack: "production",
          },
          {
            label: "Night",
            data: dates.map((d) => lastThreeMonthsGrouped[d].Night),
            backgroundColor: "rgba(153, 102, 255, 0.8)",
            stack: "production",
          },
        ],
      },
      pieData: {
        labels: ["Day Shift", "Night Shift"],
        datasets: [
          {
            data: [totalDay, totalNight],
            backgroundColor: ["rgba(54, 162, 235, 0.7)", "rgba(153, 102, 255, 0.7)"],
          },
        ],
      },
      closingStockTrend: {
        labels: overallLabels,
        datasets: [
          {
            label: "Closing Stock",
            data: closingStockData,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            fill: true,
            tension: 0.3,
          },
        ],
      },
    };
  }, [records]);

  const stackedOptions = { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } } };

  return (
    <div style={{ marginTop: 40 }}>
      <h3>📊 Monthly Production</h3>
      <Bar data={monthlyChart} />

      <h3 style={{ marginTop: 40 }}>📈 Overall Production Trend</h3>
      <Line data={overallTrend} />

      <h3 style={{ marginTop: 40 }}>📅 Daily Production (Last 3 Months)</h3>
      <Bar data={dailyStacked} options={stackedOptions} />

      <h3 style={{ marginTop: 40 }}>🥧 Day vs Night Contribution</h3>
      <Pie data={pieData} />

      <h3 style={{ marginTop: 40 }}>📦 Closing Stock Trend</h3>
      <Line data={closingStockTrend} />
    </div>
  );
}