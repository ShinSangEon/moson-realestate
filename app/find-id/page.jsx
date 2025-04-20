"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function FindIdPage() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [foundEmail, setFoundEmail] = useState("");

  const handleFindId = async () => {
    try {
      const res = await fetch("/api/auth/find-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber }),
      });

      const data = await res.json();

      if (res.ok && data.email) {
        setFoundEmail(data.email);
        toast.success("🎉 이메일을 찾았습니다!");
      } else {
        setFoundEmail("");
        toast.error(data.message || "일치하는 이메일이 없습니다.");
      }
    } catch (err) {
      toast.error("서버 오류가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-2xl space-y-6"
      >
        <h1 className="text-3xl font-bold text-center text-green-600 mb-4">
          🔍 아이디 찾기
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <input
            type="tel"
            placeholder="전화번호"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full border border-gray-300 px-4 py-3 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <button
            onClick={handleFindId}
            className="w-full bg-green-600 text-white py-3 rounded-md text-lg hover:bg-green-700 transition"
          >
            아이디 찾기
          </button>
        </div>

        <AnimatePresence>
          {foundEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center mt-6 space-y-4"
            >
              <p className="text-green-700 font-semibold text-lg">
                ✅ 가입된 이메일은 <br />
                <span className="text-xl font-bold">{foundEmail}</span> 입니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                <Link
                  href="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow"
                >
                  🔐 로그인하러 가기
                </Link>
                <Link
                  href="/reset-password"
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow"
                >
                  🔑 비밀번호 찾기
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
