"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, Heart, Bell } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data);
      } catch (err) {
        toast.error("로그인이 필요합니다.");
      }
    };

    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorite/list");
        const data = await res.json();
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
        } else {
          throw new Error("찜 목록 형식 오류");
        }
      } catch (err) {
        toast.error("찜 목록 불러오기 실패");
      } finally {
        setLoading(false);
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notification", {
          credentials: "include",
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("알림 불러오기 실패", err);
      }
    };

    fetchUser();
    fetchFavorites();
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-20 text-gray-500">불러오는 중...</div>
    );
  }

  if (!user) {
    return (
      <div className="text-center mt-20 text-red-500">로그인이 필요합니다.</div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto space-y-10"
      >
        {/* 유저 정보 카드 */}
        <div className="bg-white p-6 rounded-xl shadow flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-green-600">마이페이지</h1>
            <div className="flex items-center gap-2 text-gray-700">
              <User size={18} /> 회원번호: {user.userId}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail size={18} /> 이메일: {user.email}
            </div>
          </div>
          <Heart size={36} className="text-pink-500" />
        </div>

        {/* 알림 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔔 내 알림</h2>
          {notifications.length === 0 ? (
            <p className="text-gray-500">알림이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="border p-3 rounded-md text-sm bg-yellow-50 shadow-sm"
                >
                  📣 {n.message}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 찜한 아파트 목록 */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ❤️ 찜한 아파트 목록
          </h2>

          {favorites.length === 0 ? (
            <p className="text-gray-500">찜한 아파트가 없습니다.</p>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/apt/${encodeURIComponent(fav.complexUniqueId)}`}
                  className="block bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden border"
                >
                  <div className="h-40 bg-gray-100 relative">
                    <Image
                      src="/apt_placeholder.jpg"
                      alt="아파트"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg truncate">
                      {fav.apartment?.complexNameBuilding || "이름 없는 아파트"}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      📍 {fav.apartment?.address}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      등록일: {new Date(fav.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
