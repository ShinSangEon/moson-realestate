"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const menuItems = [
    { href: "/", label: "홈" },
    { href: "/map", label: "지도" },
    { href: "/find", label: "구해줘!" },
    { href: "/sell", label: "팔아줘!" },
    { href: "/community", label: "지역 커뮤니티" },
    { href: "/guide", label: "모르면손해 사용법" },
  ];

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();

        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          if (res.status === 401) {
            await fetch("/api/auth/logout", {
              method: "POST",
              credentials: "include",
            });
          }
        }
      } catch (error) {
        console.error("인증 확인 실패:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 10 * 60 * 1000); // 10분마다 확인
    return () => clearInterval(interval);
  }, []);

  // 알림 확인
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      const now = Date.now();
      if (now - lastCheck < 60 * 1000) return; // 1분 이내에 이미 확인했다면 건너뛰기

      try {
        const res = await fetch("/api/notification", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter((n) => !n.isRead).length);
          setLastCheck(now);
        }
      } catch (err) {
        console.error("알림 불러오기 실패:", err);
      }
    };

    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60 * 1000); // 1분마다 확인
      return () => clearInterval(interval);
    }
  }, [user, lastCheck]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setUser(null);
        toast.success("로그아웃 되었습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
      toast.error("로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await fetch("/api/notification", {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notificationId: notification.id }),
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => prev - 1);
      } catch (err) {
        console.error("알림 읽음 처리 실패:", err);
      }
    }

    if (notification.postId) {
      window.location.href = `/community/${notification.postId}`;
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    try {
      await fetch(`/api/notification/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => prev - 1);
    } catch (err) {
      console.error("알림 삭제 실패:", err);
    }
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  if (loading) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="로고" width={36} height={36} />
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

          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-700 hover:text-green-600"
                >
                  관리자
                </Link>
              )}
              {user.role === "agent" && (
                <Link
                  href="/agent"
                  className="text-sm font-medium text-gray-700 hover:text-green-600"
                >
                  중개사
                </Link>
              )}
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

          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2 rounded-full text-gray-700 hover:bg-gray-100 relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && notifications.length > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-2 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        !notification.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {notification.type === "COMMENT" && "💬"}
                            {notification.type === "REPLY" && "↩️"}
                            {notification.type === "ACCEPT" && "✅"}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-800">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) =>
                            handleDeleteNotification(notification.id, e)
                          }
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
              {user ? (
                <>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-center py-2 text-sm text-gray-700 hover:text-green-600"
                    >
                      관리자
                    </Link>
                  )}
                  {user.role === "agent" && (
                    <Link
                      href="/agent"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-center py-2 text-sm text-gray-700 hover:text-green-600"
                    >
                      중개사
                    </Link>
                  )}
                  <Link
                    href="/mypage"
                    onClick={() => setIsMenuOpen(false)}
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
