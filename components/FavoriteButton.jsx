"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function FavoriteButton({ complexUniqueId, compact = false }) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true); // 초기 로딩 방지

  // ✅ 찜 상태 조회 (로그인 여부 포함)
  useEffect(() => {
    const fetchFavorite = async () => {
      try {
        const res = await fetch(
          `/api/favorite?complexUniqueId=${complexUniqueId}`,
          {
            credentials: "include", // ✅ 쿠키 포함
          }
        );
        const data = await res.json();
        if (res.ok) {
          setIsFavorite(data.isFavorite);
        }
      } catch (err) {
        console.error("찜 상태 확인 실패", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorite();
  }, [complexUniqueId]);

  // ✅ 찜 토글
  const handleClick = async () => {
    try {
      const res = await fetch("/api/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ 로그인 세션 유지 필수
        body: JSON.stringify({ complexUniqueId }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsFavorite(data.isFavorite);
        toast.success(
          data.isFavorite
            ? "❤️ 찜 목록에 추가했어요!"
            : "💔 찜 목록에서 제거했어요!"
        );
      } else {
        toast.warning(data.error || "로그인을 하셔야 찜하기가 가능합니다.");
      }
    } catch (err) {
      console.error("찜 실패", err);
      toast.error("알 수 없는 오류가 발생했어요.");
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={handleClick}
      className={`text-lg ${
        compact
          ? "text-pink-500"
          : "px-4 py-2 bg-pink-100 text-pink-800 font-semibold rounded-lg shadow hover:bg-pink-200 transition"
      }`}
    >
      {isFavorite ? "❤️ 찜취소" : "🤍 찜하기"}
    </button>
  );
}
