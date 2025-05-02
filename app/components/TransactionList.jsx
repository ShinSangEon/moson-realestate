"use client";

export default function TransactionList({ transactions }) {
  const formatDate = (year, month, day) => {
    return `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const formatPrice = (type, saleAmount, depositAmount) => {
    const amount = type === "매매" ? saleAmount : depositAmount;
    if (!amount) return "-";
    const 억 = Math.floor(amount / 10000);
    const 만 = amount % 10000;
    if (억 > 0) {
      return `${억}억${만 > 0 ? ` ${만}만` : ""}`;
    }
    return `${만}만`;
  };

  // 고유 식별자 생성 함수
  const generateUniqueId = (transaction) => {
    return `${transaction.dealYear}-${transaction.dealMonth}-${transaction.dealDay}-${transaction.area}-${transaction.floor}-${transaction.dealType}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              거래일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              면적
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              거래유형
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              금액
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              층
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((t) => (
            <tr key={generateUniqueId(t)} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(t.dealYear, t.dealMonth, t.dealDay)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {Math.round(t.area)}㎡
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    t.dealType === "매매"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {t.dealType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatPrice(t.dealType, t.saleAmount, t.depositAmount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {t.floor}층
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
