"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AreaPriceChart({ areaStats }) {
  // 데이터가 없을 때 처리
  if (!areaStats || !Array.isArray(areaStats) || areaStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        평형별 시세 데이터가 없습니다.
      </div>
    );
  }

  const formatPrice = (value) => {
    if (!value) return "-";
    const 억 = Math.floor(value / 10000);
    const 만 = value % 10000;
    if (억 > 0) {
      return `${억}억${만 > 0 ? ` ${만}만` : ""}`;
    }
    return `${만}만`;
  };

  const data = {
    labels: areaStats.map((stat) => stat.group),
    datasets: [
      {
        label: "매매가",
        data: areaStats.map((stat) => stat.avgSale),
        backgroundColor: "rgba(248, 113, 113, 0.8)",
        borderColor: "rgb(248, 113, 113)",
        borderWidth: 1,
      },
      {
        label: "전세가",
        data: areaStats.map((stat) => stat.avgRent),
        backgroundColor: "rgba(96, 165, 250, 0.8)",
        borderColor: "rgb(96, 165, 250)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          padding: 20,
          font: { size: 13 },
          color: "#374151",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const stat = areaStats[context.dataIndex];
            const count =
              context.dataset.label === "매매가"
                ? stat.saleCount
                : stat.rentCount;
            return `${context.dataset.label}: ${formatPrice(
              value
            )} (${count}건)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatPrice(value),
        },
        grid: {
          color: "rgba(209, 213, 219, 0.3)",
        },
      },
    },
  };

  return (
    <div className="w-full h-[300px] sm:h-[380px]">
      <Bar data={data} options={options} />
    </div>
  );
}
