"use client";

import { useState, useEffect } from "react";

export default function TransactionHistory({ complexUniqueId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(
          `/api/apt/transactions?complexUniqueId=${complexUniqueId}`
        );
        if (!response.ok) {
          throw new Error("거래 내역을 불러올 수 없습니다.");
        }
        const data = await response.json();
        setTransactions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [complexUniqueId]);

  if (loading) {
    return <div className="text-center py-4 text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">오류: {error}</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        거래 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              거래일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              거래금액
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              전용면적
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              층
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {`${transaction.dealYear}.${transaction.dealMonth}.${transaction.dealDay}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.dealAmount.toLocaleString()}만원
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.area}㎡
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transaction.floor}층
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
