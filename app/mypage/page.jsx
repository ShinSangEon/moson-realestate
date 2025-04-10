"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail } from "lucide-react";
import { toast } from "sonner";

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl"
      >
        <h1 className="text-2xl font-bold text-green-600 mb-4 text-center">
          마이페이지
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          로그인한 회원 정보를 확인하세요
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <User className="text-green-500" size={20} />
            <p className="text-gray-800 text-sm">회원번호: {user.userId}</p>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="text-green-500" size={20} />
            <p className="text-gray-800 text-sm">이메일: {user.email}</p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>여기에 추후 즐겨찾기, 내 게시글 등 확장 가능 📌</p>
        </div>
      </motion.div>
    </div>
  );
}
