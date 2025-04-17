"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function PriceChart({ complexUniqueId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          `/api/apt/transactions/route?complexUniqueId=${complexUniqueId}`
        );

        if (response.status === 404) {
          setError("거래 데이터가 없습니다.");
          return;
        }

        if (!response.ok) {
          throw new Error("거래 데이터를 불러올 수 없습니다.");
        }

        const transactions = await response.json();

        if (!Array.isArray(transactions) || transactions.length === 0) {
          setError("거래 데이터가 없습니다.");
          return;
        }

        // 거래 데이터를 월별로 그룹화하고 평균 가격 계산
        const monthlyData = transactions.reduce((acc, transaction) => {
          const key = `${transaction.dealYear}-${transaction.dealMonth}`;
          if (!acc[key]) {
            acc[key] = {
              count: 0,
              total: 0,
              date: `${transaction.dealYear}년 ${transaction.dealMonth}월`,
            };
          }
          acc[key].count++;
          acc[key].total += transaction.dealAmount;
          return acc;
        }, {});

        // 월별 평균 가격 데이터로 변환
        const chartData = Object.values(monthlyData).map((item) => ({
          date: item.date,
          price: Math.round(item.total / item.count),
        }));

        // 날짜순으로 정렬
        chartData.sort((a, b) => {
          const [aYear, aMonth] = a.date.split("년 ")[0].split("-");
          const [bYear, bMonth] = b.date.split("년 ")[0].split("-");
          return aYear === bYear
            ? parseInt(aMonth) - parseInt(bMonth)
            : parseInt(aYear) - parseInt(bYear);
        });

        setData(chartData);
      } catch (err) {
        console.error("거래 데이터 조회 오류:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [complexUniqueId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-gray-500 py-4">{error}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        거래 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            tickFormatter={(value) => `${(value / 10000).toLocaleString()}만원`}
          />
          <Tooltip
            formatter={(value) => [
              `${(value / 10000).toLocaleString()}만원`,
              "평균 거래가",
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
