"use client";

import { motion } from "framer-motion";
import { Search, Building2, Home, Store, Warehouse, Hotel } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative w-full h-[90vh] bg-gradient-to-br from-green-100 to-white flex items-center justify-center overflow-hidden">
      {/* 배경 이미지 or 색 */}
      <div className="absolute inset-0">
        <img
          src="/images/bg-city.jpg"
          alt="city background"
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      {/* 내용 영역 */}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 bg-white rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row items-center gap-4"
        >
          <input
            type="text"
            placeholder="지역, 단지명, 역 이름 등으로 검색"
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none"
          />
          <button className="bg-green-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-600 transition">
            <Search size={18} /> 검색
          </button>
        </motion.div>

        {/* 카테고리 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 flex justify-center flex-wrap gap-4"
        >
          <CategoryButton icon={<Home />} label="원룸" />
          <CategoryButton icon={<Hotel />} label="투룸" />
          <CategoryButton icon={<Building2 />} label="오피스텔" />
          <CategoryButton icon={<Warehouse />} label="아파트" />
          <CategoryButton icon={<Store />} label="상가" />
        </motion.div>
      </div>
    </section>
  );
}

function CategoryButton({ icon, label }) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-green-100 transition">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
