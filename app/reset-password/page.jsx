"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const [step, setStep] = useState(1); // 1 = 사용자 확인, 2 = 인증코드 입력, 3 = 비밀번호 변경
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRequestReset = async () => {
    const email = form.email.trim();
    const name = form.name.trim();
    const phoneNumber = form.phoneNumber.trim();

    if (!email || !name || !phoneNumber) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("인증 코드가 이메일로 전송되었습니다.");
        setStep(2);
      } else {
        toast.error(data.message || "정보가 일치하지 않습니다.");
      }
    } catch (err) {
      toast.error("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const email = form.email.trim();
    const code = form.code.trim();

    if (!email || !code) {
      toast.error("인증 코드를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("인증이 완료되었습니다. 새 비밀번호를 입력해주세요.");
        setStep(3);
      } else {
        toast.error(data.message || "인증 실패");
      }
    } catch (err) {
      toast.error("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newPassword = form.newPassword.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (newPassword.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("비밀번호가 변경되었습니다. 로그인해주세요.");
        window.location.href = "/login";
      } else {
        toast.error(data.message || "비밀번호 변경 실패");
      }
    } catch (err) {
      toast.error("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-green-600">
          🔒 비밀번호 재설정
        </h1>

        {step === 1 && (
          <>
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={form.email}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
              className="w-full border px-4 py-2 rounded-md"
            />
            <input
              type="text"
              name="name"
              placeholder="이름"
              value={form.name}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
              className="w-full border px-4 py-2 rounded-md"
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="전화번호"
              value={form.phoneNumber}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
              className="w-full border px-4 py-2 rounded-md"
            />
            <button
              onClick={handleRequestReset}
              disabled={loading}
              className={`w-full py-2 rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "처리 중..." : "인증 코드 받기"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              name="code"
              placeholder="이메일 인증 코드 입력"
              value={form.code}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
              className="w-full border px-4 py-2 rounded-md"
            />
            <button
              onClick={handleVerifyCode}
              disabled={loading}
              className={`w-full py-2 rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "처리 중..." : "인증 코드 확인"}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="새 비밀번호"
                value={form.newPassword}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                className="w-full border px-4 py-2 rounded-md pr-12"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈 숨기기" : "👀 보기"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={form.confirmPassword}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                className="w-full border px-4 py-2 rounded-md pr-12"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈 숨기기" : "👀 보기"}
              </button>
            </div>
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className={`w-full py-2 rounded-md text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "처리 중..." : "비밀번호 변경하기"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
