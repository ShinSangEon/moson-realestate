import { Line } from "react-chartjs-2";
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

const TransactionChart = ({ transactions }) => {
  if (!transactions || transactions.length === 0) {
    return <div className="text-center p-4">거래 데이터가 없습니다.</div>;
  }

  // 날짜별로 정렬
  const sorted = [...transactions].sort((a, b) => {
    const dateA = new Date(a.dealYear, a.dealMonth - 1, a.dealDay);
    const dateB = new Date(b.dealYear, b.dealMonth - 1, b.dealDay);
    return dateA - dateB;
  });

  // 모든 거래 날짜 라벨 생성 (중복 제거)
  const labels = Array.from(
    new Set(
      sorted.map(
        (t) =>
          `${t.dealYear}.${String(t.dealMonth).padStart(2, "0")}.${String(
            t.dealDay
          ).padStart(2, "0")}`
      )
    )
  );

  // 날짜별로 매매가/전세가를 누적(이전 값 유지)
  let lastSale = null;
  let lastRent = null;
  const salePoints = [];
  const rentPoints = [];

  labels.forEach((label) => {
    const sale = sorted.find(
      (t) =>
        `${t.dealYear}.${String(t.dealMonth).padStart(2, "0")}.${String(
          t.dealDay
        ).padStart(2, "0")}` === label && t.dealType === "매매"
    );
    if (sale && sale.saleAmount != null) {
      lastSale = sale.saleAmount / 10000;
    }
    salePoints.push(lastSale);

    const rent = sorted.find(
      (t) =>
        `${t.dealYear}.${String(t.dealMonth).padStart(2, "0")}.${String(
          t.dealDay
        ).padStart(2, "0")}` === label && t.dealType === "전세"
    );
    if (rent && rent.depositAmount != null) {
      lastRent = rent.depositAmount / 10000;
    }
    rentPoints.push(lastRent);
  });

  const data = {
    labels,
    datasets: [
      {
        label: "매매가",
        data: salePoints,
        borderColor: "#f87171",
        backgroundColor: "rgba(248, 113, 113, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        spanGaps: true,
      },
      {
        label: "전세가",
        data: rentPoints,
        borderColor: "#60a5fa",
        backgroundColor: "rgba(96, 165, 250, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        spanGaps: true,
      },
    ],
  };

  const options = {
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
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const value = ctx.raw?.toLocaleString() ?? "-";
            return `${ctx.dataset.label}: ${value}만원`;
          },
        },
      },
    },
    layout: {
      padding: {
        bottom: 40, // 차트 하단 여백 추가
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 6,
          autoSkip: true,
          color: "#6b7280",
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value.toLocaleString()}만원`,
          color: "#6b7280",
        },
        grid: {
          color: "rgba(209, 213, 219, 0.3)",
        },
      },
    },
  };

  return (
    <div className="w-full h-[360px] mb-8">
      <Line data={data} options={options} />
    </div>
  );
};

export default TransactionChart;
