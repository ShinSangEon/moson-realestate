"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Home,
  Users,
  Car,
  Shield,
  Trash2,
  Wifi,
  Bus,
  Train,
  School,
  Heart,
  Share2,
  ArrowUpDown,
  ChartBar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KakaoMiniMap from "@/components/KakaoMap/KakaoMiniMap";
import TransactionChart from "../../components/TransactionChart";
import TransactionList from "../../components/TransactionList";
import AreaPriceChart from "../../components/AreaPriceChart";

export default function AptDetailPageClient({ initialData }) {
  const params = useParams();
  const [aptData, setAptData] = useState(initialData?.data);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!initialData?.data) {
      fetchAptData();
    }
  }, [params.kaptCode]);

  const fetchAptData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/apt/${params.kaptCode}`);
      if (!response.ok)
        throw new Error("아파트 정보를 불러오는데 실패했습니다.");
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "알 수 없는 오류가 발생했습니다.");
      setAptData(data.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-screen"
      >
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (!aptData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <p className="text-gray-500">아파트 정보를 찾을 수 없습니다.</p>
      </motion.div>
    );
  }

  const { basicInfo, detailedInfo, transactions, avgSale, avgRent, rentRate } =
    aptData;

  // 편의시설 파싱
  const welfareFacilities = detailedInfo?.welfareFacility?.split(", ") || [];
  const convenientFacilities =
    detailedInfo?.convenientFacility?.split(", ") || [];
  const educationFacilities =
    detailedInfo?.educationFacility?.split(", ") || [];

  // 교통 정보 파싱
  const subwayLines = detailedInfo?.subwayLine?.split(", ") || [];
  const subwayStations = detailedInfo?.subwayStation?.split(", ") || [];

  // 최근 거래 정보 계산
  const recentTransactions =
    transactions?.sort(
      (a, b) =>
        new Date(b.dealYear, b.dealMonth - 1) -
        new Date(a.dealYear, a.dealMonth - 1)
    ) || [];

  const recentSale = recentTransactions.find((t) => t.dealType === "매매");
  const recentRent = recentTransactions.find((t) => t.dealType === "전세");

  const formatPrice = (price) => {
    if (!price) return "정보 없음";
    const billion = Math.floor(price / 10000);
    const million = price % 10000;
    if (billion > 0) {
      return `${billion}억 ${
        million > 0 ? `${million.toLocaleString()}만` : ""
      }원`;
    }
    return `${million.toLocaleString()}만원`;
  };

  const formatDate = (year, month) => {
    if (!year || !month) return "정보 없음";
    return `${year}년 ${month}월`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative h-72 bg-gradient-to-r from-primary to-primary-dark bg-cover bg-center"
        style={{ backgroundImage: `url('/images/sample-building.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-6">
          <div className="flex justify-between items-end">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">{basicInfo.kaptName}</h1>
              <p className="text-sm opacity-90">{basicInfo.doroJuso}</p>
              <div className="flex gap-4 mt-2 text-xs">
                <p>준공일: {basicInfo.kaptUsedate}</p>
                <p>총 세대수: {basicInfo.hoCnt?.toLocaleString()}세대</p>
                <p>동 수: {basicInfo.kaptDongCnt}개</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isFavorite
                    ? "bg-white text-primary hover:bg-primary hover:text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <Heart className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("링크가 복사되었습니다.");
                }}
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 탭 네비게이션 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="sticky top-0 z-10 bg-white shadow-sm"
      >
        <div className="container mx-auto px-4">
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 border-b border-gray-200">
            {["overview", "transactions", "area", "facilities"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap
                  ${
                    activeTab === tab
                      ? "bg-white text-primary border border-b-0 shadow-sm"
                      : "text-gray-500 hover:text-primary"
                  }`}
              >
                {tab === "overview" && "개요"}
                {tab === "transactions" && "실거래 내역"}
                {tab === "area" && "면적별 시세"}
                {tab === "facilities" && "편의시설"}
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {activeTab === "overview" && (
              <Home className="w-5 h-5 text-primary" />
            )}
            {activeTab === "transactions" && (
              <ArrowUpDown className="w-5 h-5 text-primary" />
            )}
            {activeTab === "area" && (
              <ChartBar className="w-5 h-5 text-primary" />
            )}
            {activeTab === "facilities" && (
              <Building2 className="w-5 h-5 text-primary" />
            )}
            <span>
              {activeTab === "overview"
                ? "개요"
                : activeTab === "transactions"
                ? "실거래 내역"
                : activeTab === "area"
                ? "면적별 시세"
                : "편의시설"}
            </span>
          </h2>
        </div>
      </motion.div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <div className="bg-white rounded-b-2xl shadow-sm p-6">
              {/* 가격 정보 섹션 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mb-8"
              >
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4">📈 가격 정보</h2>

                  {/* 차트 */}
                  <div className="w-full h-[300px] sm:h-[380px] mb-8">
                    <TransactionChart kaptCode={basicInfo.kaptCode} />
                  </div>

                  {/* 요약 정보 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                    <div>
                      <p className="font-semibold text-gray-500 mb-1">
                        전세가율
                      </p>
                      <p>{rentRate ? `${rentRate}%` : "정보 없음"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-500 mb-1">
                        최근 매매 최고가
                      </p>
                      <p>{formatPrice(recentSale?.saleAmount)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-500 mb-1">
                        최근 전세 최고가
                      </p>
                      <p>{formatPrice(recentRent?.depositAmount)}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-500 mb-1">
                        최근 거래일
                      </p>
                      <p>
                        {formatDate(
                          recentTransactions[0]?.dealYear,
                          recentTransactions[0]?.dealMonth
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 기존 개요 카드들 */}
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              >
                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold">세대 정보</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>총 세대수: {basicInfo.hoCnt?.toLocaleString()}세대</p>
                    <p>동 수: {basicInfo.kaptDongCnt}개</p>
                    <p>
                      총 주차대수: {detailedInfo?.kaptdPcntu?.toLocaleString()}
                      대
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <Building2 className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold">건물 정보</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>구조: {detailedInfo?.codeStr}</p>
                    <p>난방: {basicInfo.codeHeatNm}</p>
                    <p>용도: {basicInfo.codeAptNm}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <ArrowUpDown className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold">승강기 정보</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>승강기 수: {detailedInfo?.kaptdEcnt}대</p>
                    <p>승강기 용량: {detailedInfo?.kaptdEcapa}kg</p>
                    <p>관리 방식: {detailedInfo?.codeElev}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold">관리 정보</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p>관리사무소: {detailedInfo?.kaptMgrCnt}명</p>
                    <p>경비원: {detailedInfo?.kaptdScnt}명</p>
                    <p>청소원: {detailedInfo?.kaptdClcnt}명</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "transactions" && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-b-2xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold mb-4">최근 실거래 내역</h3>
              <TransactionList transactions={transactions} />
            </motion.div>
          )}

          {activeTab === "area" && (
            <motion.div
              key="area"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-b-2xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold mb-4">면적별 시세</h3>
              <AreaPriceChart areaStats={aptData.areaStats} />
            </motion.div>
          )}

          {activeTab === "facilities" && (
            <motion.div
              key="facilities"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-b-2xl shadow-sm p-6"
            >
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <h3 className="text-lg font-semibold mb-3">복리시설</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {welfareFacilities.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <h3 className="text-lg font-semibold mb-3">교육시설</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {educationFacilities.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <h3 className="text-lg font-semibold mb-3">편의시설</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {convenientFacilities.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-md border-l-4 border-primary hover:scale-105 transition-transform duration-300">
                  <h3 className="text-lg font-semibold mb-3">기타 시설</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="w-5 h-5 text-primary" />
                      <span>인터넷: {detailedInfo?.codeNet}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Trash2 className="w-5 h-5 text-primary" />
                      <span>쓰레기 처리: {detailedInfo?.codeGarbage}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-5 h-5 text-primary" />
                      <span>
                        전기차 충전: 지상 {detailedInfo?.groundElChargerCnt}대,
                        지하 {detailedInfo?.undergroundElChargerCnt}대
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 지도 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-4 sm:p-8 pt-0"
      >
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-64 sm:h-96">
            <KakaoMiniMap
              address={basicInfo.doroJuso}
              dong={basicInfo.kaptName}
              lat={basicInfo.lat}
              lng={basicInfo.lng}
            />
          </div>
          <div className="p-6 border-t">
            <h3 className="text-lg font-semibold mb-4">위치 및 주변정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">교통</h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  {subwayLines.map((line, index) => (
                    <li key={index} className="flex items-center">
                      <Train className="w-4 h-4 mr-2 text-primary" />
                      <span>{line}</span>
                      {subwayStations[index] && (
                        <span className="text-gray-500 ml-1">
                          ({subwayStations[index]})
                        </span>
                      )}
                      <span className="text-gray-500 ml-1">
                        도보 {detailedInfo?.kaptdWtimesub}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center">
                    <Bus className="w-4 h-4 mr-2 text-primary" />
                    <span>
                      가장 가까운 버스정류장: {detailedInfo?.kaptdWtimebus}
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  교육시설
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  {educationFacilities.map((facility, index) => (
                    <li key={index} className="flex items-center">
                      <School className="w-4 h-4 mr-2 text-primary" />
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  편의시설
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  {convenientFacilities.map((facility, index) => (
                    <li key={index} className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-primary" />
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  복리시설
                </h4>
                <ul className="text-sm text-gray-700 space-y-2">
                  {welfareFacilities.map((facility, index) => (
                    <li key={index} className="flex items-center">
                      <Home className="w-4 h-4 mr-2 text-primary" />
                      <span>{facility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
