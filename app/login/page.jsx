"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";

const KAKAO_AUTH_URL = `${process.env.NEXT_PUBLIC_KAKAO_AUTH_URL}`;
const NAVER_AUTH_URL = `${process.env.NEXT_PUBLIC_NAVER_AUTH_URL}`;
const GOOGLE_AUTH_URL = `${process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL}`;

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.email.length < 5)
      return toast.error("아이디는 5자 이상이어야 합니다.");
    if (form.password.length < 8)
      return toast.error("비밀번호는 8자 이상이어야 합니다.");

    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success("👋 로그인 성공! 환영합니다.");
      window.location.href = "/mypage";
    } else {
      toast.error(data.error || "로그인에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl"
      >
        <h1 className="text-2xl font-bold text-center text-green-600 mb-6">
          로그인
        </h1>

        {/* 소셜 로그인 */}
        <div className="flex flex-col gap-3 mb-6">
          <a
            href={process.env.NEXT_PUBLIC_KAKAO_AUTH_URL}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-yellow-400 hover:bg-yellow-300 transition"
          >
            <Image src="/kakao.png" alt="kakao" width={20} height={20} />
            <span className="text-sm font-medium">카카오로 로그인</span>
          </a>
          <a
            href="/api/auth/naver/login"
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-green-500 hover:bg-green-400 text-white transition"
          >
            <Image src="/naver.png" alt="naver" width={20} height={20} />
            <span className="text-sm font-medium">네이버로 로그인</span>
          </a>

          <a
            href={GOOGLE_AUTH_URL}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-white border hover:bg-gray-100 transition"
          >
            <Image src="/google.png" alt="google" width={20} height={20} />
            <span className="text-sm font-medium">구글로 로그인</span>
          </a>
        </div>

        {/* 일반 로그인 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="이메일 (아이디)"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <button
              type="button"
              onClick={toggleShowPassword}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 아이디/비밀번호 찾기 */}
        <div className="text-sm text-center mt-6 text-gray-500 space-x-4">
          <Link href="/find-id" className="hover:text-green-600">
            아이디 찾기
          </Link>
          <span>|</span>
          <Link href="/reset-password" className="hover:text-green-600">
            비밀번호 찾기
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
