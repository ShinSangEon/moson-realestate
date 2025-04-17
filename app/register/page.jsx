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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userType, setUserType] = useState("user"); // 'user' 또는 'agent'
  const router = useRouter();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (form.email.length < 5) {
      return setMessage("아이디는 5자 이상이어야 합니다.");
    }
    if (form.password.length < 8) {
      return setMessage("비밀번호는 8자 이상이어야 합니다.");
    }
    if (form.password !== form.confirmPassword) {
      return setMessage("비밀번호가 일치하지 않습니다.");
    }
    if (
      userType === "agent" &&
      (!form.officeName || !form.officeAddress || !form.licenseNumber)
    ) {
      return setMessage("공인중개사 정보를 모두 입력해주세요.");
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
            agentName: form.name, // 대표자명은 name 필드에서 가져옵니다
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(verifyData.error);
        }

        if (!verifyData.isValid) {
          return setMessage("유효하지 않은 공인중개사 자격증입니다.");
        }
      } catch (error) {
        console.error("자격증 확인 오류:", error);
        return setMessage("자격증 확인 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    // 회원가입 진행
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        role: userType,
        agentName: form.name,
      }),
    });
    const result = await res.json();

    if (!res.ok) {
      setLoading(false);
      console.error("회원가입 실패 이유:", result.error);

      if (result.error.includes("이미 등록된 이메일")) {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto max-w-sm w-full bg-white border border-red-300 shadow-xl rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="text-red-500 text-xl">🚫</div>
            <div className="text-sm text-gray-800">
              <p className="font-semibold">이미 사용 중인 이메일입니다</p>
              <p className="text-gray-500">다른 이메일을 사용해주세요.</p>
            </div>
          </motion.div>
        ));
      } else if (result.error.includes("비밀번호")) {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto max-w-sm w-full bg-white border border-yellow-300 shadow-xl rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="text-yellow-500 text-xl">🔐</div>
            <div className="text-sm text-gray-800">
              <p className="font-semibold">비밀번호가 일치하지 않아요</p>
              <p className="text-gray-500">다시 한 번 확인해주세요.</p>
            </div>
          </motion.div>
        ));
      } else if (result.error.includes("자격증")) {
        toast.custom((t) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto max-w-sm w-full bg-white border border-blue-300 shadow-xl rounded-2xl p-4 flex items-start gap-3"
          >
            <div className="text-blue-500 text-xl">📄</div>
            <div className="text-sm text-gray-800">
              <p className="font-semibold">자격증 정보가 일치하지 않습니다</p>
              <p className="text-gray-500">
                사무소명과 대표자명을 다시 확인해주세요.
              </p>
            </div>
          </motion.div>
        ));
      } else {
        toast.error(result.error || "문제가 발생했어요.");
      }
      return;
    }

    setMessage("");
    toast.custom((t) => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="pointer-events-auto max-w-sm w-full bg-white border border-green-300 shadow-xl rounded-2xl p-4 flex items-start gap-3"
      >
        <div className="text-green-500 text-xl">✅</div>
        <div className="text-sm text-gray-800">
          <p className="font-semibold">회원가입이 완료되었습니다!</p>
          <p className="text-gray-500">로그인 페이지로 이동합니다.</p>
        </div>
      </motion.div>
    ));

    setForm({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phoneNumber: "",
      officeName: "",
      officeAddress: "",
      licenseNumber: "",
      profileImage: "",
    });

    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSearch = async () => {
    if (!form.officeName && !form.name) {
      setMessage("사무소명 또는 대표자명을 입력해주세요.");
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
        setMessage("검색 결과가 없습니다.");
        setSearchResults([]);
      } else {
        setMessage("");
        setSearchResults(data.offices);
      }
    } catch (error) {
      console.error("검색 오류:", error);
      setMessage("검색 중 오류가 발생했습니다.");
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

        {/* 소셜 로그인 버튼 (디자인용) */}
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
        </div>

        {/* 오류 메시지 표시 */}
        {message && (
          <div className="p-3 mb-4 rounded-md bg-red-100 text-red-600 text-sm text-center">
            {message}
          </div>
        )}

        {/* 일반 회원가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="이름"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

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

          <div className="relative">
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <input
              type="tel"
              name="phoneNumber"
              placeholder="전화번호"
              value={form.phoneNumber}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          {/* 공인중개사 추가 정보 */}
          {userType === "agent" && (
            <>
              <div className="relative">
                <input
                  type="text"
                  name="officeName"
                  placeholder="사무소명"
                  value={form.officeName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <Building2
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="name"
                  placeholder="대표자명"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <User
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={searchLoading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                {searchLoading ? "검색 중..." : "사무소 검색"}
              </button>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2">
                  {searchResults.map((office, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectOffice(office)}
                      className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <div className="font-medium">{office.officeName}</div>
                      <div className="text-sm text-gray-600">
                        대표: {office.agentName}
                      </div>
                      <div className="text-sm text-gray-600">
                        주소: {office.officeAddress}
                      </div>
                      <div className="text-sm text-gray-600">
                        자격번호: {office.licenseNumber}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  name="officeAddress"
                  placeholder="사무소 주소"
                  value={form.officeAddress}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <MapPin
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  name="licenseNumber"
                  placeholder="공인중개사 자격번호"
                  value={form.licenseNumber}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <BadgeCheck
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
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
