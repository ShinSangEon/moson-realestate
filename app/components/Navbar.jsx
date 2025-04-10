"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const menuItems = [
    { href: "/", label: "홈" },
    { href: "/map", label: "지도" },
    { href: "/find", label: "구해줘!" },
    { href: "/sell", label: "팔아줘!" },
    { href: "/community", label: "지역 커뮤니티" },
    { href: "/guide", label: "모르면손해 사용법" },
  ];

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) setIsLoggedIn(true);
      } catch (err) {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsLoggedIn(false);
    window.location.reload();
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="로고" width={36} height={36} />
          <span className="text-xl sm:text-2xl font-bold tracking-tight whitespace-nowrap">
            <span className="text-green-600">모르면</span>
            <span className="text-emerald-500">손해</span>
          </span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                className="text-sm font-medium text-green-600"
              >
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm px-4 py-1.5 rounded border border-red-400 text-red-500 hover:bg-red-100 transition"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="text-sm px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 transition">
                  로그인
                </button>
              </Link>
              <Link href="/register">
                <button className="text-sm px-4 py-1.5 rounded border border-emerald-500 text-emerald-500 hover:bg-emerald-100 transition">
                  회원가입
                </button>
              </Link>
            </>
          )}
        </div>

        {/* 모바일 메뉴 토글 */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X size={24} className="text-emerald-600" />
            ) : (
              <Menu size={24} className="text-green-600" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gray-50 px-4 pb-4 border-t border-gray-200"
          >
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-4 flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/mypage"
                    className="text-center py-2 text-sm text-green-600"
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-sm px-4 py-2 rounded border border-red-400 text-red-500 hover:bg-red-100 transition"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <button className="w-full text-sm px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition">
                      로그인
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="w-full text-sm px-4 py-2 rounded border border-emerald-500 text-emerald-500 hover:bg-emerald-100 transition">
                      회원가입
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
