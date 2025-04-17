"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

export default function RecentViewedSidebar() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const raw = localStorage.getItem("recentViewed");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setRecent(parsed);
      } catch (e) {
        console.error("최근 본 목록 파싱 실패", e);
      }
    }
  }, []);

  if (!recent || recent.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 w-72 bg-white shadow-lg rounded-xl border p-4 z-50">
      <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Clock size={18} className="text-gray-500" /> 최근 본 아파트
      </h2>
      <div className="space-y-2">
        {recent.map((id, index) => (
          <Link
            href={`/apt/${encodeURIComponent(id)}`}
            key={index}
            className="block bg-gray-50 hover:bg-gray-100 border rounded-md px-3 py-2 text-sm text-gray-700 truncate"
          >
            {id}
          </Link>
        ))}
      </div>
    </div>
  );
}
