"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  Home,
  Store,
  Warehouse,
  Hotel,
  X,
} from "lucide-react";

export default function Hero() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const query = keyword.trim();
    if (!query) return;
    router.push(`/map?query=${encodeURIComponent(query)}`);
  };

  const handleCategoryClick = (label) => {
    router.push(`/map?query=${encodeURIComponent(label)}`);
  };

  return (
    <section className="relative w-full h-[90vh] bg-gradient-to-br from-green-100 to-white flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        <img
          src="/images/bg-city.jpg"
          alt="city background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      {/* 메인 내용 */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-green-900 drop-shadow-sm"
        >
          모르면 손해,
          <br />
          <span className="text-green-600">모손</span>에서 집 구하기 시작하세요!
        </motion.h1>

        {/* 검색창 */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 bg-white rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="지역, 단지명, 역 이름 등으로 검색"
              className="w-full px-4 py-2 pr-10 rounded-xl border border-gray-200 focus:outline-none"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-red-400"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-600 transition"
          >
            <Search size={18} /> 검색
          </button>
        </motion.form>
        {/* 인기 검색어 예시 */}
        <div className="mt-4 text-sm text-gray-500">
          <span className="font-semibold text-gray-700 mr-2">
            🔥 인기 검색어:
          </span>
          {["상평동", "하대동", "아파트", "원룸", "경상대"].map((word) => (
            <button
              key={word}
              onClick={() =>
                router.push(`/map?query=${encodeURIComponent(word)}`)
              }
              className="inline-block mr-2 mb-1 px-3 py-1 bg-gray-100 hover:bg-green-100 rounded-full text-sm text-gray-700 transition"
            >
              {word}
            </button>
          ))}
        </div>
        {/* 카테고리 버튼 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 flex justify-center flex-wrap gap-4"
        >
          <CategoryButton
            icon={<Home />}
            label="원룸"
            onClick={handleCategoryClick}
          />
          <CategoryButton
            icon={<Hotel />}
            label="투룸"
            onClick={handleCategoryClick}
          />
          <CategoryButton
            icon={<Building2 />}
            label="오피스텔"
            onClick={handleCategoryClick}
          />
          <CategoryButton
            icon={<Warehouse />}
            label="아파트"
            onClick={handleCategoryClick}
          />
          <CategoryButton
            icon={<Store />}
            label="상가"
            onClick={handleCategoryClick}
          />
        </motion.div>
      </div>
    </section>
  );
}

function CategoryButton({ icon, label, onClick }) {
  return (
    <button
      onClick={() => onClick(label)}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-green-100 transition"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
