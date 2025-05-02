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
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [acceptedAnswers, setAcceptedAnswers] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setAcceptedAnswers(data.user.acceptedAnswers || 0);
          setLikesCount(data.user.likes || 0);
        }
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error);
      } finally {
        setLoading(false);
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
      }
    };

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notification", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
        }
      } catch (error) {
        console.error("알림 조회 실패:", error);
      }
    };

    fetchUserData();
    fetchFavorites();
    fetchNotifications();
  }, []);

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileType = file.type;
      const res = await fetch(`/api/upload/profile?fileType=${fileType}`);
      const { uploadUrl, key } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": fileType,
        },
        body: file,
      });

      // 업로드 후 DB에 반영
      const imageUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_S3_REGION}.amazonaws.com/${key}`;
      setPreview(imageUrl);

      // 서버에 저장된 프로필 정보 업데이트 요청
      await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: imageUrl }),
      });

      toast.success("프로필 사진이 업데이트되었습니다!");
      // 사용자 정보 갱신
      const userRes = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const userData = await userRes.json();
      if (userData.success) {
        setUser(userData.user);
      }
    } catch (err) {
      toast.error("사진 업로드 실패");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // 프로필 저장 핸들러
  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          phoneNumber,
          profileImage: user.profileImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "프로필 저장 실패");

      setUser(data.user);
      toast.success("프로필이 저장되었습니다.");
    } catch (err) {
      console.error("프로필 저장 실패:", err);
      toast.error(err.message || "프로필 저장에 실패했습니다.");
    }
  };

  // user 상태가 변경될 때 nickname과 phoneNumber 업데이트
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || "");
      setPhoneNumber(user.phoneNumber || "");
      setProfileImage(user.profileImage || "");
    }
  }, [user]);

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
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 왼쪽 사이드바 */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 mb-4">
                  <Image
                    src={user?.profileImage || "/default-profile.png"}
                    alt="프로필 이미지"
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.nickname || user?.name}
                </h2>
                {user?.role === "agent" && (
                  <p className="text-sm text-gray-500">
                    {user?.agent?.officeName}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {user?.rank ? `[${user.rank}]` : ""}
                </p>
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "profile"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  프로필
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "notifications"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  알림 내역
                </button>
                <button
                  onClick={() => setActiveTab("points")}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "points"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  포인트 내역
                </button>
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeTab === "favorites"
                      ? "bg-green-100 text-green-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  관심 목록
                </button>
              </nav>
            </div>
          </div>

          {/* 오른쪽 컨텐츠 영역 */}
          <div className="md:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-lg shadow p-6">
                {/* 유저 정보 카드 */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={
                                user.role === "AGENT"
                                  ? user.agent?.officeName
                                  : user.nickname || user.name
                              }
                              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                e.target.src = "/images/default-avatar.png";
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                              <span className="text-3xl font-bold text-white">
                                {user.role === "AGENT"
                                  ? user.agent?.officeName?.[0] || "?"
                                  : user.nickname?.[0] || user.name?.[0] || "?"}
                              </span>
                            </div>
                          )}
                          {user.role === "AGENT" && (
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                              공인중개사
                            </div>
                          )}
                        </div>
                        <div>
                          <h1 className="text-2xl font-bold">
                            {user.role === "AGENT"
                              ? user.agent?.officeName || "사무소명 없음"
                              : user.nickname || user.name || "익명"}
                          </h1>
                          {user.role !== "AGENT" && (
                            <p className="text-gray-600">
                              {user.rank ? `[${user.rank}]` : "[BRONZE]"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail size={18} /> {user.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.rank === "DIAMOND"
                              ? "bg-purple-100 text-purple-800"
                              : user.rank === "PLATINUM"
                              ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-sm"
                              : user.rank === "GOLD"
                              ? "bg-yellow-100 text-yellow-800"
                              : user.rank === "SILVER"
                              ? "bg-gray-200 text-gray-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {user.rank === "DIAMOND"
                            ? "💎 다이아몬드"
                            : user.rank === "PLATINUM"
                            ? "✨ 플래티넘"
                            : user.rank === "GOLD"
                            ? "⭐ 골드"
                            : user.rank === "SILVER"
                            ? "⚪ 실버"
                            : "🟤 브론즈"}
                        </div>
                        <div className="text-xs text-gray-500">
                          (채택된 답변: {user.acceptedAnswers}개)
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-full overflow-hidden border">
                        {preview || user.profileImage ? (
                          <img
                            src={preview || user.profileImage}
                            alt="프로필"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                            No Image
                          </div>
                        )}
                      </div>
                      <label className="text-sm text-green-600 cursor-pointer hover:underline">
                        {uploading ? "업로드 중..." : "사진 변경"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 등급 상승 가이드 */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      📈 등급 상승 가이드
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-30">브론즈 → 실버⚪</span>
                        <span>채택된 답변 10개</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-30">실버⚪ → 골드⭐</span>
                        <span>채택된 답변 20개</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-30">
                          골드⭐ → <br></br>플래티넘✨
                        </span>
                        <span>채택된 답변 50개</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-30"> 다이아몬드💎</span>
                        <span>채택된 답변 100개</span>
                      </div>
                    </div>
                  </div>

                  {/* 사용자 통계 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {user.points || 0}
                      </div>
                      <div className="text-sm text-gray-600">포인트</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {likesCount}
                      </div>
                      <div className="text-sm text-gray-600">좋아요</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {acceptedAnswers}
                      </div>
                      <div className="text-sm text-gray-600">채택</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {user.badges?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">뱃지</div>
                    </div>
                  </div>
                </div>

                {/* 프로필 설정 */}
                <div className="bg-white p-6 rounded-xl shadow space-y-4">
                  <h2 className="text-lg font-bold text-green-700">
                    🛠️ 내 프로필 설정
                  </h2>

                  {/* 닉네임 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>

                  {/* 전화번호 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full border rounded p-2"
                      placeholder="010-1234-5678"
                    />
                  </div>

                  {/* 저장 버튼 */}
                  <button
                    onClick={handleSaveProfile}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    저장하기
                  </button>
                </div>

                {/* 뱃지 섹션 */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <h2 className="text-lg font-bold text-green-700 mb-4">
                    🏆 내 뱃지
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 뱃지 목록 */}
                    {[
                      {
                        badgeId: "first-answer",
                        name: "첫 답변",
                        description: "첫 답변을 작성하세요",
                        imageUrl: "/badges/first-answer.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "first-answer"
                        ),
                      },
                      {
                        badgeId: "expert-answerer",
                        name: "전문 답변가",
                        description: "답변 10개 이상 작성",
                        imageUrl: "/badges/expert-answerer.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "expert-answerer"
                        ),
                      },
                      {
                        badgeId: "master-answerer",
                        name: "답변 마스터",
                        description: "답변 30개 이상 작성",
                        imageUrl: "/badges/master-answerer.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "master-answerer"
                        ),
                      },
                      {
                        badgeId: "first-post",
                        name: "첫 게시글",
                        description: "첫 게시글을 작성하세요",
                        imageUrl: "/badges/first-post.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "first-post"
                        ),
                      },
                      {
                        badgeId: "popular",
                        name: "인기 작성자",
                        description: "좋아요 10개 이상 받기",
                        imageUrl: "/badges/popular.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "popular"
                        ),
                      },
                      {
                        badgeId: "answer-king",
                        name: "답변왕",
                        description: "답변 5개 이상 작성",
                        imageUrl: "/badges/answer-king.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "answer-king"
                        ),
                      },
                      {
                        badgeId: "accepted-king",
                        name: "채택왕",
                        description: "답변 3개 이상 채택",
                        imageUrl: "/badges/accepted-king.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "accepted-king"
                        ),
                      },
                      {
                        badgeId: "community-star",
                        name: "커뮤니티 스타",
                        description: "좋아요 50개 이상 받기",
                        imageUrl: "/badges/community-star.svg",
                        earned: user.badges?.some(
                          (b) => b.badgeId === "community-star"
                        ),
                      },
                    ].map((badge) => {
                      // 디버깅 로그 추가
                      console.log(`뱃지 체크: ${badge.name}`, {
                        badgeId: badge.badgeId,
                        earned: badge.earned,
                        userBadges: user.badges,
                      });

                      return (
                        <div
                          key={badge.badgeId}
                          className={`relative p-4 rounded-lg text-center transition-all duration-300 ${
                            badge.earned
                              ? "bg-yellow-50 shadow-md transform hover:scale-105"
                              : "bg-gray-50 opacity-50"
                          }`}
                        >
                          <div className="relative w-16 h-16 mx-auto mb-2">
                            <img
                              src={badge.imageUrl}
                              alt={badge.name}
                              className={`w-full h-full object-contain ${
                                badge.earned ? "opacity-100" : "opacity-30"
                              }`}
                            />
                          </div>
                          <h3
                            className={`font-semibold text-sm ${
                              badge.earned ? "text-yellow-800" : "text-gray-500"
                            }`}
                          >
                            {badge.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {badge.description}
                          </p>
                          {!badge.earned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                획득 조건
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  알림 내역
                </h2>
                {notifications.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    알림이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border ${
                          !notification.isRead
                            ? "bg-blue-50 border-blue-200"
                            : "border-gray-200"
                        }`}
                      >
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "points" && (
              <div className="bg-white rounded-lg shadow p-6">
                {/* 기존 포인트 내역 내용 */}
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="bg-white rounded-lg shadow p-6">
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
                        href={`/apt/${encodeURIComponent(fav.kaptCode)}`}
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
                            {fav.apartment?.kaptName || "이름 없는 아파트"}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            📍 {fav.apartment?.kaptAddr}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            등록일:{" "}
                            {new Date(fav.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
