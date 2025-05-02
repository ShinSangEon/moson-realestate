"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  FolderOpenDot,
  PencilLine,
  MapPin,
  Megaphone,
  Home,
  Scale,
  Building2,
  MessageSquare,
  UserCheck,
  ThumbsUp,
  CheckCircle2,
  BadgeCheck,
  Eye,
  Shield,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CommunityListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("진주시");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("latest");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postsRes, promotionsRes] = await Promise.all([
          fetch("/api/post/all"),
          fetch("/api/promotion/featured"),
        ]);

        const postsData = await postsRes.json();
        const promotionsData = await promotionsRes.json();

        if (postsData.success) setPosts(postsData.posts);
        if (promotionsData.success) setPromotions(promotionsData.promotions);
      } catch (err) {
        console.error("데이터 불러오기 실패", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPosts = posts
    .filter(
      (post) =>
        selectedCategory === "전체" || post.category === selectedCategory
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "popular":
          return b.views - a.views;
        case "likes":
          return b.likeCount - a.likeCount;
        default:
          return 0;
      }
    });

  const categories = [
    {
      id: "전체",
      icon: <Home className="w-4 h-4" />,
      color: "gray",
    },
    {
      id: "매물 질문",
      icon: <Home className="w-4 h-4" />,
      color: "green",
    },
    {
      id: "계약/법률",
      icon: <Scale className="w-4 h-4" />,
      color: "purple",
    },
    {
      id: "신축/분양",
      icon: <Building2 className="w-4 h-4" />,
      color: "orange",
    },
    {
      id: "동네 이야기",
      icon: <MessageSquare className="w-4 h-4" />,
      color: "yellow",
    },
    {
      id: "공인중개사에게 묻기",
      name: "공인중개사에게 묻기",
      description: "공인중개사에게 질문하고 답변을 받아보세요",
      color: "blue",
      icon: <UserCheck className="w-4 h-4" />,
    },
  ];

  const getCategoryStyle = (category) => {
    const cat = categories.find((c) => c.id === category);
    if (!cat) return "bg-gray-100 text-gray-600";

    switch (cat.color) {
      case "green":
        return "bg-green-100 text-green-600";
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      case "orange":
        return "bg-orange-100 text-orange-600";
      case "yellow":
        return "bg-yellow-100 text-yellow-600";
      case "gray":
        return "bg-gray-200 text-gray-600";
      default:
        return "bg-blue-100 text-blue-600";
    }
  };

  const getAuthorStyle = (author) => {
    if (!author) return "bg-gray-200 text-gray-600";

    if (author.role === "realtor") {
      return "bg-blue-100 text-blue-600";
    } else if (author.role === "admin") {
      return "bg-purple-100 text-purple-600";
    }
    return "bg-gray-200 text-gray-600";
  };

  return (
    <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-10 gap-8">
      {/* 메인 컨텐츠 */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-green-700">
              <MapPin className="inline-block mr-2" />
              {selectedRegion} 커뮤니티
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                {["진주시"].map((region) => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-3 sm:px-4 py-2 border rounded-full text-sm transition ${
                      selectedRegion === region
                        ? "bg-green-500 text-white"
                        : "hover:bg-green-100"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border px-3 py-2 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="latest">최신순</option>
                <option value="popular">조회수순</option>
                <option value="likes">좋아요순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-sm transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? cat.color === "blue"
                    ? "bg-blue-500 text-white"
                    : `${getCategoryStyle(cat.id)
                        .replace("100", "500")
                        .replace("600", "white")}`
                  : `${getCategoryStyle(cat.id)} hover:opacity-80`
              }`}
            >
              {cat.icon}
              {cat.id}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin mr-2 text-green-500" />
            불러오는 중...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-20">
            <FolderOpenDot size={36} />
            <p className="mt-2">선택한 카테고리에 게시글이 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 모바일 카드형 리스트 */}
            <div className="lg:hidden grid gap-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 shadow-sm bg-white cursor-pointer hover:shadow-md transition"
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`text-xs ${getCategoryStyle(
                        post.category
                      )} px-2 py-1 rounded-full inline-block`}
                    >
                      {post.category}
                    </div>
                    {post.isAnswered ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        답변 완료
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        미답변
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-green-700 mb-2">
                    {post.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-2">
                      {post.author?.profileImage ? (
                        <img
                          src={post.author.profileImage}
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <UserCircle className="w-6 h-6 text-gray-400" />
                      )}
                      <span
                        className={`px-2 py-1 rounded-full ${getAuthorStyle(
                          post.author
                        )} flex items-center gap-1`}
                      >
                        {post.author?.role === "realtor" && (
                          <BadgeCheck className="w-3 h-3" />
                        )}
                        {post.author?.role === "admin" && (
                          <Shield className="w-3 h-3" />
                        )}
                        {post.author?.nickname ||
                          post.author?.name ||
                          "알 수 없음"}
                      </span>
                    </div>
                    {post.author?.badges?.map((badge, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 px-2 py-1 rounded-full"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post._count?.comments || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post._count?.likes || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </div>
                    </div>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크탑 테이블 */}
            <div className="hidden lg:block overflow-x-auto border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 text-left">
                  <tr>
                    <th className="px-4 py-3 border">카테고리</th>
                    <th className="px-4 py-3 border">제목</th>
                    <th className="px-4 py-3 border">상태</th>
                    <th className="px-4 py-3 border">작성자</th>
                    <th className="px-4 py-3 border">답변</th>
                    <th className="px-4 py-3 border">좋아요</th>
                    <th className="px-4 py-3 border">작성일</th>
                    <th className="px-4 py-3 border">조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/community/${post.id}`)}
                    >
                      <td className="px-4 py-3 border">
                        <div
                          className={`text-xs ${getCategoryStyle(
                            post.category
                          )} px-2 py-1 rounded-full inline-block`}
                        >
                          {post.category}
                        </div>
                      </td>
                      <td className="px-4 py-3 border text-green-700 font-semibold">
                        {post.title}
                      </td>
                      <td className="px-4 py-3 border">
                        {post.isAnswered ? (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            답변 완료
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            미답변
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {post.author?.profileImage ? (
                              <img
                                src={post.author.profileImage}
                                alt={post.author.name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <UserCircle className="w-6 h-6 text-gray-400" />
                            )}
                            <span
                              className={`px-2 py-1 rounded-full ${getAuthorStyle(
                                post.author
                              )} flex items-center gap-1`}
                            >
                              {post.author?.role === "realtor" && (
                                <BadgeCheck className="w-3 h-3" />
                              )}
                              {post.author?.role === "admin" && (
                                <Shield className="w-3 h-3" />
                              )}
                              {post.author?.nickname ||
                                post.author?.name ||
                                "알 수 없음"}
                            </span>
                          </div>
                          {post.author?.badges?.map((badge, i) => (
                            <span
                              key={i}
                              className="text-xs bg-gray-100 px-2 py-1 rounded-full"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post._count?.comments || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post._count?.likes || 0}
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 border">{post.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 오른쪽 하단 작성하기 버튼 */}
        <Link
          href="/community/write"
          className="fixed bottom-8 right-8 z-50 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm"
        >
          <PencilLine size={18} /> 작성하기
        </Link>
      </div>

      {/* 우측 홍보 배너 */}
      <div className="w-full lg:w-52">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <img
            src="/ads/banner-jinju.jpg"
            alt="진주 부동산 광고"
            className="w-full"
          />
          <div className="p-2 text-sm text-gray-600">
            <strong>📣 분양 홍보</strong>
            <br />
            진주 혁신도시 84㎡ 분양 중!
          </div>
        </div>
      </div>
    </div>
  );
}
