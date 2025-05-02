"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TransactionChart({ kaptCode }) {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartOptions, setChartOptions] = useState(null);

  // 가격을 억 단위로 변환하는 함수
  const formatPrice = (price) => {
    if (price === null || price === undefined) return null;
    const 억 = Math.floor(price / 10000);
    const 만 = price % 10000;
    if (만 === 0) return `${억}억`;
    return `${억}억 ${만}만`;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/apt/${kaptCode}`);
        if (!response.ok)
          throw new Error("아파트 정보를 불러오는데 실패했습니다.");
        const data = await response.json();
        if (!data.success)
          throw new Error(data.message || "데이터를 불러오는데 실패했습니다.");

        const transactions = data.data.transactions || [];
        console.log("📊 원본 거래 데이터:", transactions);

        if (transactions.length === 0) {
          setError("거래 데이터가 없습니다.");
          return;
        }

        // 월별로 그룹화 및 정렬
        const grouped = {};
        let lastSalePrice = null;
        let lastRentPrice = null;

        // 날짜순으로 정렬
        const sortedTransactions = transactions.sort((a, b) => {
          const dateA = new Date(a.dealYear, a.dealMonth - 1, a.dealDay);
          const dateB = new Date(b.dealYear, b.dealMonth - 1, b.dealDay);
          return dateA - dateB;
        });

        sortedTransactions.forEach((t) => {
          const key = `${t.dealYear}.${String(t.dealMonth).padStart(2, "0")}`;
          if (!grouped[key]) {
            grouped[key] = {
              sale: [],
              rent: [],
              lastSale: lastSalePrice,
              lastRent: lastRentPrice,
            };
          }
          if (t.dealType === "매매" && t.saleAmount) {
            grouped[key].sale.push(t.saleAmount);
            lastSalePrice = t.saleAmount;
          } else if (t.dealType === "전세" && t.depositAmount) {
            grouped[key].rent.push(t.depositAmount);
            lastRentPrice = t.depositAmount;
          }
        });

        console.log("📈 월별 그룹화된 데이터:", grouped);

        // 정렬된 라벨 & 평균값 계산
        const labels = Object.keys(grouped).sort();
        const salePoints = labels.map((key) => {
          const values = grouped[key].sale;
          if (values.length > 0) {
            const avg = Math.round(
              values.reduce((a, b) => a + b) / values.length
            );
            console.log(`💰 ${key}월 매매가:`, {
              원본데이터: values,
              평균값: avg,
              변환된값: formatPrice(avg),
            });
            return avg;
          }
          // 해당 월에 거래가 없으면 이전 거래가 사용
          return grouped[key].lastSale;
        });

        const rentPoints = labels.map((key) => {
          const values = grouped[key].rent;
          if (values.length > 0) {
            const avg = Math.round(
              values.reduce((a, b) => a + b) / values.length
            );
            console.log(`💰 ${key}월 전세가:`, {
              원본데이터: values,
              평균값: avg,
              변환된값: formatPrice(avg),
            });
            return avg;
          }
          // 해당 월에 거래가 없으면 이전 거래가 사용
          return grouped[key].lastRent;
        });

        console.log("📊 차트 데이터:", {
          labels,
          salePoints,
          rentPoints,
        });

        // 최대값과 최소값 계산 (2천만원 단위로 조정)
        const allValues = [...salePoints, ...rentPoints].filter(
          (v) => v !== null && v !== undefined
        );
        const maxValue = Math.max(...allValues);
        const minValue = Math.min(...allValues);
        const yAxisMax = Math.ceil(maxValue / 2000) * 2000;
        const yAxisMin = Math.floor(minValue / 2000) * 2000;

        console.log("📈 y축 범위:", {
          최대값: maxValue,
          최소값: minValue,
          y축최대: yAxisMax,
          y축최소: yAxisMin,
        });

        setChartData({
          labels,
          datasets: [
            {
              label: "매매가",
              data: salePoints,
              borderColor: "#f87171",
              backgroundColor: "rgba(248, 113, 113, 0.1)",
              tension: 0.4,
              fill: true,
              spanGaps: false,
              pointRadius: 3,
            },
            {
              label: "전세가",
              data: rentPoints,
              borderColor: "#60a5fa",
              backgroundColor: "rgba(96, 165, 250, 0.1)",
              tension: 0.4,
              fill: true,
              spanGaps: false,
              pointRadius: 3,
            },
          ],
        });

        setChartOptions({
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                font: { size: 13 },
                color: "#374151",
              },
            },
            title: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const price = ctx.raw;
                  if (price === null || price === undefined)
                    return `${ctx.dataset.label}: -`;
                  return `${ctx.dataset.label}: ${formatPrice(price)}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 12,
                autoSkip: true,
                color: "#6b7280",
              },
              grid: { display: false },
            },
            y: {
              min: yAxisMin,
              max: yAxisMax,
              ticks: {
                stepSize: 2000,
                callback: (value) => formatPrice(value),
                color: "#6b7280",
              },
              grid: {
                color: "rgba(209, 213, 219, 0.3)",
              },
            },
          },
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (kaptCode) fetchData();
  }, [kaptCode]);

  if (loading)
    return <div className="p-4 text-center">📊 데이터 불러오는 중...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!chartData)
    return <div className="p-4 text-center">표시할 데이터가 없습니다.</div>;

  return (
    <div className="w-full h-[280px] sm:h-[340px] px-2">
      <Line
        data={chartData}
        options={{
          ...chartOptions,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            },
          },
          plugins: {
            ...chartOptions.plugins,
            legend: {
              ...chartOptions.plugins.legend,
              position: "top",
              align: "start",
              labels: {
                padding: 20,
                font: { size: 13 },
                color: "#374151",
              },
            },
          },
        }}
      />
    </div>
  );
}
