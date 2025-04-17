"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  FolderOpenDot,
  PencilLine,
  MapPin,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

export default function CommunityListPage() {
  const [posts, setPosts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("진주시");
  const [selectedCategory, setSelectedCategory] = useState("전체");

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

  const filteredPosts = posts.filter(
    (post) => selectedCategory === "전체" || post.category === selectedCategory
  );

  return (
    <div className="flex max-w-7xl mx-auto px-4 py-10 gap-8">
      {/* 메인 컨텐츠 */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-green-700">
            <MapPin className="inline-block mr-2" />
            {selectedRegion} 커뮤니티
          </h1>
          <div className="flex gap-2">
            {["진주시"].map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-2 border rounded-full text-sm transition ${
                  selectedRegion === region
                    ? "bg-green-500 text-white"
                    : "hover:bg-green-100"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-3 mb-6">
          {["전체", "자랑", "궁금해요", "잡담"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 border rounded-full text-sm transition ${
                selectedCategory === cat
                  ? "bg-green-500 text-white"
                  : "hover:bg-green-100"
              }`}
            >
              #{cat}
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
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-gray-700 text-left">
                <tr>
                  <th className="px-4 py-3 border">카테고리</th>
                  <th className="px-4 py-3 border">제목</th>
                  <th className="px-4 py-3 border">작성일</th>
                  <th className="px-4 py-3 border">조회수</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => (location.href = `/community/${post.id}`)}
                  >
                    <td className="px-4 py-3 border">{post.category}</td>
                    <td className="px-4 py-3 border text-green-700 font-semibold">
                      {post.title}
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
        )}

        {/* 오른쪽 하단 작성하기 버튼 */}
        <Link
          href="/community/write"
          className="fixed bottom-8 right-8 z-50 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm"
        >
          <PencilLine size={18} /> 작성하기
        </Link>
      </div>

      {/* 사이드바 - 홍보 섹션 */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-4">
          <h2 className="text-xl font-bold text-green-700 mb-4 flex items-center">
            <Megaphone className="mr-2" />
            {selectedRegion} 홍보
          </h2>

          {promotions.length > 0 ? (
            <div className="space-y-4">
              {promotions.map((promo) => (
                <Link
                  key={promo.id}
                  href={`/promotion/${promo.id}`}
                  className="block group"
                >
                  <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                    {promo.imageUrl && (
                      <div className="aspect-video relative">
                        <img
                          src={promo.imageUrl}
                          alt={promo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition">
                        {promo.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {promo.content}
                      </p>
                      <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                        <span>
                          {new Date(promo.startDate).toLocaleDateString()} ~{" "}
                          {new Date(promo.endDate).toLocaleDateString()}
                        </span>
                        <span>조회수 {promo.views}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              현재 진행 중인 홍보가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
