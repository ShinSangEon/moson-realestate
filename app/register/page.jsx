"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  MapPin,
  BadgeCheck,
  Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phoneNumber: "",
    officeName: "",
    officeAddress: "",
    licenseNumber: "",
    profileImage: "",
    verifyCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [userType, setUserType] = useState("user");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const router = useRouter();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSendEmailCode = async () => {
    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("이메일로 인증 코드가 전송되었습니다.");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("이메일 인증 실패:", error);
      toast.error("인증 코드 전송에 실패했습니다.");
    }
  };

  const handleVerifyEmailCode = async () => {
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          code: form.verifyCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsEmailVerified(true);
        toast.success("이메일 인증 완료되었습니다.");
      } else {
        toast.error(data.message || "인증 코드가 일치하지 않습니다.");
      }
    } catch (error) {
      console.error("인증 코드 확인 실패:", error);
      toast.error("인증 확인 중 오류 발생");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (form.email.length < 5) {
      newErrors.email = "이메일은 5자 이상이어야 합니다.";
    }
    if (!isEmailVerified) {
      newErrors.email = "이메일 인증이 필요합니다.";
    }
    if (form.password.length < 8) {
      newErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }
    if (!form.name) {
      newErrors.name = "이름을 입력해주세요.";
    }
    if (!form.phoneNumber) {
      newErrors.phoneNumber = "전화번호를 입력해주세요.";
    }
    if (userType === "agent") {
      if (!form.officeName) newErrors.officeName = "사무소명을 입력해주세요.";
      if (!form.officeAddress)
        newErrors.officeAddress = "사무소 주소를 입력해주세요.";
      if (!form.licenseNumber)
        newErrors.licenseNumber = "자격번호를 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 입력 시 해당 필드의 에러 메시지 제거
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 공인중개사인 경우 자격증 확인
    if (userType === "agent") {
      try {
        setLoading(true);
        const verifyResponse = await fetch("/api/auth/verify-license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            officeName: form.officeName,
            agentName: form.name,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error);
        }

        if (!verifyData.isValid) {
          toast.error("유효하지 않은 공인중개사 자격증입니다.");
          return;
        }
      } catch (error) {
        console.error("자격증 확인 오류:", error);
        toast.error("자격증 확인 중 오류가 발생했습니다.");
        return;
      } finally {
        setLoading(false);
      }
    }

    // 회원가입 진행
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          role: userType,
          agentName: form.name,
          verifyCode: form.verifyCode,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "회원가입에 실패했습니다.");
      }

      toast.success("회원가입이 완료되었습니다!");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSearch = async () => {
    if (!form.officeName && !form.name) {
      toast.error("사무소명 또는 대표자명을 입력해주세요.");
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch("/api/auth/verify-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeName: form.officeName,
          agentName: form.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      if (data.offices.length === 0) {
        toast.error("검색 결과가 없습니다.");
        setSearchResults([]);
      } else {
        toast.success("");
        setSearchResults(data.offices);
      }
    } catch (error) {
      console.error("검색 오류:", error);
      toast.error("검색 중 오류가 발생했습니다.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectOffice = (office) => {
    setForm((prev) => ({
      ...prev,
      officeName: office.officeName,
      officeAddress: office.officeAddress,
      licenseNumber: office.licenseNumber,
    }));
    setSearchResults([]);
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
          회원가입
        </h1>

        {/* 사용자 유형 선택 */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setUserType("user")}
            className={`flex-1 py-2 px-4 border rounded-md text-center ${
              userType === "user"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            일반 사용자
          </button>
          <button
            type="button"
            onClick={() => setUserType("agent")}
            className={`flex-1 py-2 px-4 border rounded-md text-center ${
              userType === "agent"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-300"
            }`}
          >
            공인중개사
          </button>
        </div>

        {/* 소셜 로그인 버튼 (디자인용)
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={() => router.push("/login")}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-yellow-400 hover:bg-yellow-300 transition"
          >
            <Image src="/kakao.png" alt="kakao" width={20} height={20} />
            <span className="text-sm font-medium">카카오로 시작하기</span>
          </button>

          <button
            onClick={() => router.push("/login")}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-green-500 hover:bg-green-400 text-white transition"
          >
            <Image src="/naver.png" alt="naver" width={20} height={20} />
            <span className="text-sm font-medium">네이버로 시작하기</span>
          </button>

          <button
            onClick={() => router.push("/login")}
            className="flex items-center justify-center gap-2 w-full py-2 rounded bg-gray-500 hover:bg-red-400 text-white transition"
          >
            <Image src="/google.png" alt="google" width={20} height={20} />
            <span className="text-sm font-medium">Google로 시작하기</span>
          </button>
        </div> */}

        {/* 오류 메시지 표시 */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 mb-4 rounded-md bg-red-100 text-red-600 text-sm text-center">
            {Object.values(errors).join("\n")}
          </div>
        )}

        {/* 일반 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <input
                type="text"
                name="name"
                placeholder="이름"
                value={form.name}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              <User
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="이메일 (아이디)"
                value={form.email}
                onChange={handleChange}
                required
                readOnly={isEmailVerified}
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.email ? "border-red-500" : ""
                } ${isEmailVerified ? "bg-gray-100 text-gray-500" : ""}`}
              />
              <Mail
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
            {isEmailVerified && (
              <p className="text-green-600 text-sm mt-1">✅ 이메일 인증 완료</p>
            )}
          </div>

          {/* 이메일 인증 입력란 */}
          <div className="space-y-2">
            <div className="relative flex gap-2">
              <input
                type="text"
                placeholder="이메일 인증 코드 입력"
                value={form.verifyCode || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, verifyCode: e.target.value }))
                }
                readOnly={isEmailVerified}
                className={`flex-1 pl-3 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  isEmailVerified ? "bg-gray-100 text-gray-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={!form.email || loading}
                className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "전송 중..." : "인증 코드 전송"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerifyEmailCode}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              인증 코드 확인
            </button>
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              <Lock
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-2.5 text-gray-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                placeholder="비밀번호 확인"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
              />
              <Lock
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="relative">
              <input
                type="tel"
                name="phoneNumber"
                placeholder="전화번호"
                value={form.phoneNumber}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                  errors.phoneNumber ? "border-red-500" : ""
                }`}
              />
              <Phone
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
            )}
          </div>

          {/* 공인중개사 추가 정보 */}
          {userType === "agent" && (
            <>
              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    name="officeName"
                    placeholder="사무소명"
                    value={form.officeName}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                      errors.officeName ? "border-red-500" : ""
                    }`}
                  />
                  <Building2
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                </div>
                {errors.officeName && (
                  <p className="text-red-500 text-sm">{errors.officeName}</p>
                )}
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {searchLoading ? "검색 중..." : "사무소 검색"}
                </button>
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {searchResults.map((office) => (
                      <div
                        key={office.licenseNumber}
                        onClick={() => handleSelectOffice(office)}
                        className="p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <p className="font-medium">{office.officeName}</p>
                        <p className="text-sm text-gray-600">
                          대표자: {office.agentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {office.officeAddress}
                        </p>
                        <p className="text-xs text-gray-500">
                          자격번호: {office.licenseNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    name="officeAddress"
                    placeholder="사무소 주소"
                    value={form.officeAddress}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                      errors.officeAddress ? "border-red-500" : ""
                    }`}
                  />
                  <MapPin
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                </div>
                {errors.officeAddress && (
                  <p className="text-red-500 text-sm">{errors.officeAddress}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="text"
                    name="licenseNumber"
                    placeholder="공인중개사 자격번호"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    required
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 ${
                      errors.licenseNumber ? "border-red-500" : ""
                    }`}
                  />
                  <BadgeCheck
                    className="absolute left-3 top-2.5 text-gray-400"
                    size={18}
                  />
                </div>
                {errors.licenseNumber && (
                  <p className="text-red-500 text-sm">{errors.licenseNumber}</p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            {loading ? "가입 중..." : "가입하기"}
          </button>
        </form>

        {/* 아이디/비번 찾기 */}
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
