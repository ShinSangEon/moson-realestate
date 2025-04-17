// app/apt/[complexUniqueId]/AptDetailPageClient.jsx
"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import KakaoMap from "@/components/KakaoMap/KakaoMiniMap";
import TransactionHistory from "@/components/TransactionHistory";
import PriceChart from "@/components/PriceChart";
import { motion } from "framer-motion";

export default function AptDetailPageClient({ apt }) {
  if (!apt || !apt.complexUniqueId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-xl">아파트 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem("recentViewed") || "[]");
    const updated = [
      apt.complexUniqueId,
      ...viewed.filter((v) => v !== apt.complexUniqueId),
    ].slice(0, 3);
    localStorage.setItem("recentViewed", JSON.stringify(updated));
  }, [apt.complexUniqueId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 상단 타이틀 및 이미지 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-2 gap-8 mb-12"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">
              🏢 {apt.complexNameBuilding || "이름 없는 아파트"}
            </h1>
            <div className="shrink-0">
              <FavoriteButton complexUniqueId={apt.complexUniqueId} />
            </div>
          </div>
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="text-lg">{apt.address}</p>
          </div>
          <p className="text-sm text-gray-500">
            단지 고유번호:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {apt.complexUniqueId}
            </code>
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden shadow-xl">
          <Image
            src="/apt_placeholder.jpg"
            alt="단지 이미지"
            width={800}
            height={600}
            className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </motion.div>

      {/* 핵심 정보 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12"
      >
        {[
          {
            label: "승인일",
            value: apt.approvalDate
              ? apt.approvalDate.toISOString().slice(0, 10)
              : "정보 없음",
            icon: "📅",
          },
          {
            label: "세대수",
            value: `${apt.householdCount?.toLocaleString?.() || 0} 세대`,
            icon: "🏠",
          },
          { label: "동수", value: `${apt.buildingCount || 0}동`, icon: "🏢" },
          { label: "층수", value: `${apt.floorCount || 0}층`, icon: "⬆️" },
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{item.icon}</span>
              <p className="text-gray-500 text-sm">{item.label}</p>
            </div>
            <p className="text-xl font-semibold text-gray-800">{item.value}</p>
          </div>
        ))}
      </motion.div>

      {/* 지도 및 좌표 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-12"
      >
        <div className="flex items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">📍 위치 정보</h2>
          <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            위도: {apt.latitude}, 경도: {apt.longitude}
          </div>
        </div>
        <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-xl">
          <KakaoMap address={apt.address} dong={apt.dong} />
        </div>
      </motion.div>

      {/* 거래 내역 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 거래 내역</h2>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <TransactionHistory complexUniqueId={apt.complexUniqueId} />
        </div>
      </motion.div>

      {/* 시세 차트 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 시세 추이</h2>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <PriceChart complexUniqueId={apt.complexUniqueId} />
        </div>
      </motion.div>

      {/* 보고서 구매 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="relative overflow-hidden rounded-2xl shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="relative p-8 md:p-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              📄 이 아파트의 분석 보고서를 확인해보세요
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              실거래가 분석, 주변 시세 비교, 향후 전망까지 포함된 전문가 작성
              리포트를 단돈{" "}
              <span className="font-bold text-green-600">₩1,000</span>에 확인할
              수 있습니다.
            </p>
            <Link
              href={`/report/${encodeURIComponent(apt.complexUniqueId)}`}
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="mr-2">🛒</span>
              보고서 구매하기
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
