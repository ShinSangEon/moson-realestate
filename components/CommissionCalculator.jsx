"use client";

import { Calculator, Info } from "lucide-react";
import { calculateCommission } from "@/lib/commission";

export default function CommissionCalculator({ property }) {
  if (!property) return null;

  const { rate, commission } = calculateCommission(
    property.type,
    property.price,
    property.deposit || 0,
    property.monthlyFee || 0
  );

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-green-600" />
        중개수수료 계산기
      </h3>

      <div className="space-y-2 text-sm">
        <p>
          ✅ <span className="font-bold">{property.type}</span> 요율:{" "}
          <span className="text-green-600 font-semibold">
            {(rate * 100).toFixed(1)}%
          </span>
        </p>
        <p>
          💵 예상 수수료:{" "}
          <span className="text-green-700 font-bold text-lg">
            {commission.toLocaleString()}원
          </span>
        </p>
      </div>

      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        <Info className="w-4 h-4" /> 실매물 등록 시 소비자와 협의해 수수료율
        조정이 가능합니다.
      </p>
    </div>
  );
}
