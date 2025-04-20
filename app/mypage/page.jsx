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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUser(data.user);
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImage: imageUrl }),
      });

      toast.success("프로필 사진이 업데이트되었습니다!");
      setUser((prev) => ({ ...prev, profileImage: imageUrl }));
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
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          phoneNumber,
        }),
      });

      if (!res.ok) throw new Error("프로필 저장 실패");

      toast.success("프로필이 저장되었습니다.");
    } catch (err) {
      console.error("프로필 저장 실패:", err);
      toast.error("프로필 저장에 실패했습니다.");
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
