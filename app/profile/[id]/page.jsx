"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

const rankColors = {
  BRONZE: "text-amber-600",
  SILVER: "text-gray-400",
  GOLD: "text-yellow-500",
  PLATINUM: "text-blue-400",
  DIAMOND: "text-purple-500",
};

const rankNames = {
  BRONZE: "브론즈",
  SILVER: "실버",
  GOLD: "골드",
  PLATINUM: "플래티넘",
  DIAMOND: "다이아몬드",
};

export default function ProfilePage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/user/${id}`);
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("사용자 정보 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        로딩 중...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        사용자를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4">
          <img
            src={user.profileImage || "/default-avatar.png"}
            alt={user.name}
            className="w-24 h-24 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold">{user.nickname || user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              <span className={`font-bold ${rankColors[user.rank]}`}>
                {rankNames[user.rank]}
              </span>
              <span className="text-gray-500 ml-2">
                • 채택된 답변 {user.acceptedAnswersCount}개
              </span>
              <span className="text-gray-500 ml-2">
                • 포인트 {user.points}P
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">획득한 뱃지</h2>
          <div className="grid grid-cols-2 gap-4">
            {user.badges.map((badge) => (
              <div key={badge.id} className="flex items-center space-x-2">
                <img
                  src={badge.imageUrl}
                  alt={badge.name}
                  className="w-8 h-8"
                />
                <div>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">최근 작성한 게시글</h2>
          <div className="space-y-2">
            {user.posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block p-2 hover:bg-gray-50 rounded"
              >
                <p className="font-medium">{post.title}</p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">채택된 답변</h2>
          <div className="space-y-2">
            {user.comments.map((comment) => (
              <Link
                key={comment.id}
                href={`/community/${comment.post.id}`}
                className="block p-2 hover:bg-gray-50 rounded"
              >
                <p className="font-medium">{comment.post.title}</p>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {comment.content}
                </p>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
