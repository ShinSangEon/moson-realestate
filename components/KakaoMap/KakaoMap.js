"use client";
import "rc-slider/assets/index.css";
import Slider from "rc-slider";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { toast } from "sonner";
import hallImage from "@/app/assets/hall.webp";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ChevronRight,
  Phone,
  MessageSquare,
  Star,
  Shield,
  Filter,
  DollarSign,
  Check,
  RotateCcw,
  Building,
  Search,
  Calculator,
  Info,
} from "lucide-react";

import KakaoMapSettings from "./KakaoMapSettings";
import KakaoAbstractOverlay from "./KakaoAbstractOverlay";
import MapTypeButton from "./MapTypeButton";
import ZoomControls from "./ZoomControls";
import KakaoMapViewType from "./KakaoMapViewType";
import KakaoPolygonOverlay from "./KakaoPolygonOverlay";

const defaultPosition = { lat: 35.1803, lng: 128.1087 };

const PRICE_MIN = 1000000;
const PRICE_MAX = 1000000000;
const PRICE_STEP = 1000000;

const DEPOSIT_MIN = 0;
const DEPOSIT_MAX = 300000000;
const DEPOSIT_STEP = 1000000;

const MONTHLY_MIN = 0;
const MONTHLY_MAX = 5000000;
const MONTHLY_STEP = 10000;

const formatKoreanMoney = (num) => {
  if (!num || isNaN(num)) return "0원";
  const eok = Math.floor(num / 100000000);
  const chun = Math.floor((num % 100000000) / 10000000);
  const man = Math.floor((num % 10000000) / 10000);
  let result = "";
  if (eok > 0) result += `${eok}억 `;
  if (chun > 0) result += `${chun}천 `;
  if (eok === 0 && chun === 0 && man > 0) result += `${man}만`;
  return result.trim();
};

const PriceRangeSlider = ({ filters, setFilters }) => {
  const value = [filters.minPrice || PRICE_MIN, filters.maxPrice || PRICE_MAX];

  const handleChange = ([newMin, newMax]) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: newMin,
      maxPrice: newMax,
      minPriceDisplay: formatKoreanMoney(newMin),
      maxPriceDisplay: formatKoreanMoney(newMax),
    }));
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        가격 범위 선택
      </label>

      <div className="mb-3 text-green-700 font-semibold text-sm">
        {formatKoreanMoney(value[0])} ~ {formatKoreanMoney(value[1])}
      </div>

      <Slider
        range
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={value}
        onChange={handleChange}
        trackStyle={[{ backgroundColor: "#22c55e" }]}
        handleStyle={[
          { borderColor: "#22c55e", backgroundColor: "#fff" },
          { borderColor: "#22c55e", backgroundColor: "#fff" },
        ]}
        railStyle={{ backgroundColor: "#d1fae5" }}
      />
    </div>
  );
};

const DepositRangeSlider = ({ filters, setFilters }) => {
  const value = filters.deposit || DEPOSIT_MIN;

  const handleChange = (newValue) => {
    setFilters((prev) => ({
      ...prev,
      deposit: newValue,
      depositDisplay: formatKoreanMoney(newValue),
    }));
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        보증금 범위 선택
      </label>

      <div className="mb-3 text-green-700 font-semibold text-sm">
        {formatKoreanMoney(value)}
      </div>

      <Slider
        min={DEPOSIT_MIN}
        max={DEPOSIT_MAX}
        step={DEPOSIT_STEP}
        value={value}
        onChange={handleChange}
        trackStyle={{ backgroundColor: "#22c55e" }}
        handleStyle={{ borderColor: "#22c55e", backgroundColor: "#fff" }}
        railStyle={{ backgroundColor: "#d1fae5" }}
      />
    </div>
  );
};

const MonthlyRentRangeSlider = ({ filters, setFilters }) => {
  const value = filters.monthlyFee || MONTHLY_MIN;

  const handleChange = (newValue) => {
    setFilters((prev) => ({
      ...prev,
      monthlyFee: newValue,
      monthlyDisplay: formatKoreanMoney(newValue),
    }));
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-600" />
        월세 범위 선택
      </label>

      <div className="mb-3 text-green-700 font-semibold text-sm">
        {formatKoreanMoney(value)}
      </div>

      <Slider
        min={MONTHLY_MIN}
        max={MONTHLY_MAX}
        step={MONTHLY_STEP}
        value={value}
        onChange={handleChange}
        trackStyle={{ backgroundColor: "#22c55e" }}
        handleStyle={{ borderColor: "#22c55e", backgroundColor: "#fff" }}
        railStyle={{ backgroundColor: "#d1fae5" }}
      />
    </div>
  );
};

const KakaoMap = ({ address, dong }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mapType, setMapType] = useState("ROADMAP");
  const [mapReady, setMapReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [cctvVisible, setCctvVisible] = useState(false);
  const [selectedComplexCode, setSelectedComplexCode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [clusterer, setClusterer] = useState(null);
  const [dongData, setDongData] = useState([]);
  const [apartmentMarkers, setApartmentMarkers] = useState([]);
  const [currentMarkers, setCurrentMarkers] = useState([]);
  const [selectedDong, setSelectedDong] = useState(null);
  const [dongBoundary, setDongBoundary] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("query")?.trim().toLowerCase() || "";
  const [showPropertyList, setShowPropertyList] = useState(false);
  const [showPropertyDetail, setShowPropertyDetail] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [activeTab, setActiveTab] = useState("매매");
  const [refReady, setRefReady] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    minPrice: "",
    maxPrice: "",
    minPyung: "",
    maxPyung: "",
    dong: "",
    complexName: "",
    isVerified: "",
    deposit: "",
    monthlyFee: "",
    minPriceDisplay: "",
    maxPriceDisplay: "",
    depositDisplay: "",
    monthlyFeeDisplay: "",
  });

  // ✅ mapRef 상태 감지
  useEffect(() => {
    if (mapRef.current) {
      setRefReady(true);
    }
  }, [mapRef]);

  // ✅ SDK 로딩 보장
  useEffect(() => {
    if (typeof window !== "undefined" && window.kakao) {
      if (window.kakao.maps && !sdkLoaded) {
        console.log("🌐 SDK는 이미 있음 → setSdkLoaded");
        setScriptLoaded(true);
        setSdkLoaded(true);
      }
    }
  }, []);

  // ✅ 카카오맵 초기화
  useEffect(() => {
    if (!scriptLoaded || !sdkLoaded || !refReady) return;

    console.log("🧠 다시 지도 init 시도");

    const options = {
      center: new window.kakao.maps.LatLng(
        defaultPosition.lat,
        defaultPosition.lng
      ),
      level: 7,
      disableDoubleClickZoom: true,
      scrollwheel: true,
      draggable: true,
    };

    try {
      const newMap = new window.kakao.maps.Map(mapRef.current, options);
      newMap.addControl(
        new window.kakao.maps.MapTypeControl(),
        window.kakao.maps.ControlPosition.TOPRIGHT
      );
      newMap.addControl(
        new window.kakao.maps.ZoomControl(),
        window.kakao.maps.ControlPosition.RIGHT
      );

      setMap(newMap);
      setMapReady(true);
      console.log("🗺️ 지도 초기화 완료!");
    } catch (err) {
      console.error("❌ 지도 초기화 실패:", err);
      toast.error("지도 초기화에 실패했습니다.");
    }
  }, [scriptLoaded, sdkLoaded, refReady]);

  // ✅ 줌 레벨 변경 이벤트 핸들러
  useEffect(() => {
    if (!map) return;

    const zoomChangedHandler = () => {
      const level = map.getLevel();
      setZoomLevel(level);
    };

    window.kakao.maps.event.addListener(
      map,
      "zoom_changed",
      zoomChangedHandler
    );
    return () => {
      window.kakao.maps.event.removeListener(
        map,
        "zoom_changed",
        zoomChangedHandler
      );
    };
  }, [map]);

  // ✅ 아파트 마커 데이터 로드
  useEffect(() => {
    if (!mapReady) return;
    const fetchApartmentMarkers = async () => {
      try {
        const res = await fetch("/api/apartmentMarker", { cache: "no-store" });
        const data = await res.json();
        setApartmentMarkers(data);
      } catch (err) {
        console.error("📌 아파트 마커 데이터 불러오기 실패:", err);
        toast.error("아파트 마커 데이터를 불러오지 못했습니다");
      }
    };

    fetchApartmentMarkers();
  }, [mapReady]);

  // ✅ 행정동 데이터 로드
  useEffect(() => {
    if (!mapReady) return;
    const fetchDongData = async () => {
      try {
        const res = await fetch("/api/dongData", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setDongData(data);
      } catch (err) {
        console.error("📌 행정동 데이터 불러오기 실패:", err);
        toast.error("행정동 데이터를 불러오지 못했습니다");
      }
    };

    fetchDongData();
  }, [mapReady]);

  // ✅ 클러스터 생성 및 마커 표시
  useEffect(() => {
    if (!map || !mapReady) return;

    // 기존 클러스터 제거
    if (clusterer) {
      clusterer.clear();
    }

    // 기존 마커들 제거
    currentMarkers.forEach((marker) => marker.setMap(null));
    setCurrentMarkers([]);

    // 기존 경계선 제거
    if (dongBoundary) {
      dongBoundary.setMap(null);
    }

    // 줌 레벨이 5 이상일 때는 행정동별 클러스터 표시
    if (zoomLevel >= 5) {
      if (!apartmentMarkers.length) return;

      // 아파트 주소에서 동 추출
      const dongGroups = apartmentMarkers.reduce((acc, marker) => {
        const dongMatch = marker.address.match(/([가-힣]+동)/);
        if (dongMatch) {
          const dongName = dongMatch[1];
          if (!acc[dongName]) {
            acc[dongName] = {
              name: dongName,
              markers: [],
              center: { lat: 0, lng: 0 },
              count: 0,
            };
          }
          acc[dongName].markers.push(marker);
          acc[dongName].count++;
        }
        return acc;
      }, {});

      // 각 동의 중심점 계산
      Object.values(dongGroups).forEach((group) => {
        const latSum = group.markers.reduce(
          (sum, marker) => sum + marker.latitude,
          0
        );
        const lngSum = group.markers.reduce(
          (sum, marker) => sum + marker.longitude,
          0
        );
        group.center = {
          lat: latSum / group.markers.length,
          lng: lngSum / group.markers.length,
        };
      });

      // 행정동 텍스트 라벨 생성
      Object.values(dongGroups).forEach((group) => {
        const content = document.createElement("div");
        content.style.cssText = `
          position: relative;
          padding: 8px 12px;
          background: rgba(51, 136, 255, 0.9);
          border-radius: 20px;
          color: white;
          font-weight: bold;
          font-size: 14px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          border: 2px solid white;
          cursor: pointer;
          transition: all 0.3s ease;
        `;
        content.innerHTML = `
          ${group.name}
          <div style="
            font-size: 12px;
            margin-top: 4px;
            color: rgba(255,255,255,0.9);
          ">
            ${group.count}개 아파트
          </div>
        `;

        const overlay = new window.kakao.maps.CustomOverlay({
          content: content,
          position: new window.kakao.maps.LatLng(
            group.center.lat,
            group.center.lng
          ),
          yAnchor: 0.5,
          zIndex: 1,
        });

        // 클릭 이벤트 추가
        content.addEventListener("click", () => {
          // 선택된 행정동 설정
          setSelectedDong(group.name);

          // 해당 지역으로 지도 이동 및 줌인
          const center = new window.kakao.maps.LatLng(
            group.center.lat,
            group.center.lng
          );
          map.panTo(center);
          setTimeout(() => {
            map.setLevel(4);
          }, 300);
        });

        // 호버 효과 추가
        content.addEventListener("mouseover", () => {
          content.style.transform = "scale(1.05)";
          content.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
        });

        content.addEventListener("mouseout", () => {
          content.style.transform = "scale(1)";
          content.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
        });

        overlay.setMap(map);
        setCurrentMarkers((prev) => [...prev, overlay]);
      });

      return;
    }

    // 줌 레벨이 5 미만일 때는 개별 아파트 마커 표시
    if (!apartmentMarkers.length) return;

    const markers = apartmentMarkers.map((marker) => {
      const newMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(
          marker.latitude,
          marker.longitude
        ),
        title: marker.complexName,
        image: new window.kakao.maps.MarkerImage(
          "/marker_apartment.svg",
          new window.kakao.maps.Size(40, 40),
          {
            offset: new window.kakao.maps.Point(20, 20),
            alt: marker.complexName,
            shape: "circle",
            coords: "20,20,18",
          }
        ),
        zIndex: 1,
      });

      // 마커에 호버 효과 추가
      window.kakao.maps.event.addListener(newMarker, "mouseover", () => {
        newMarker.setZIndex(2);
      });

      window.kakao.maps.event.addListener(newMarker, "mouseout", () => {
        newMarker.setZIndex(1);
      });

      // 마커 클릭 이벤트 추가
      window.kakao.maps.event.addListener(newMarker, "click", () => {
        router.push(`/apt/${marker.complexUniqueId}`);
      });

      return newMarker;
    });

    // 아파트 마커를 지도에 직접 추가
    markers.forEach((marker) => marker.setMap(map));
    setCurrentMarkers(markers);
    setClusterer(null);

    return () => {
      if (clusterer) {
        clusterer.clear();
      }
      // 컴포넌트 언마운트 시 모든 마커 제거
      currentMarkers.forEach((marker) => marker.setMap(null));
      setCurrentMarkers([]);
    };
  }, [map, mapReady, apartmentMarkers, zoomLevel]);

  // ✅ 매물 데이터 가져오기
  const fetchProperties = async () => {
    try {
      console.log("🔍 매물 데이터 요청 시작");
      const res = await fetch("/api/property/all-public");
      console.log("📡 API 응답 상태:", res.status);

      if (!res.ok) {
        throw new Error(
          `매물 데이터를 불러오는데 실패했습니다. (${res.status})`
        );
      }

      const data = await res.json();
      console.log("📦 매물 데이터 응답:", {
        success: data.success,
        propertiesCount: data.properties?.length || 0,
        firstProperty: data.properties?.[0],
      });

      if (data.success) {
        setProperties(data.properties);
        setShowPropertyList(true);
        console.log("✅ 매물 데이터 설정 완료");
      } else {
        throw new Error(data.message || "알 수 없는 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("❌ 매물 데이터 불러오기 실패:", err);
      toast.error("매물 데이터를 불러오지 못했습니다");
    }
  };

  // ✅ 매물 상세 정보 가져오기
  const fetchPropertyDetail = async (propertyId) => {
    try {
      const res = await fetch(`/api/property/${propertyId}`);
      if (!res.ok) {
        throw new Error("매물 상세 정보를 불러오는데 실패했습니다.");
      }
      const data = await res.json();
      if (data.success) {
        setSelectedProperty(data.property);
        setShowPropertyDetail(true);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error("매물 상세 정보 불러오기 실패:", err);
      toast.error("매물 상세 정보를 불러오지 못했습니다");
    }
  };

  // ✅ 지도 타입 전환
  const handleMapTypeChange = () => {
    if (!map) return;
    const nextType = mapType === "ROADMAP" ? "SKYVIEW" : "ROADMAP";
    setMapType(nextType);
    map.setMapTypeId(
      nextType === "ROADMAP"
        ? window.kakao.maps.MapTypeId.ROADMAP
        : window.kakao.maps.MapTypeId.HYBRID
    );
  };

  // ✅ 내 위치 이동
  const handleCurrentLocation = () => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLocation = new window.kakao.maps.LatLng(latitude, longitude);
        map.panTo(userLocation);
        toast.success("📍 현재 위치로 이동했습니다!");
      },
      () => toast.error("위치 정보를 가져올 수 없습니다")
    );
  };

  // ✅ 지도 초기화
  const handleResetMap = () => {
    if (!map) return;
    map.setCenter(
      new window.kakao.maps.LatLng(defaultPosition.lat, defaultPosition.lng)
    );
    map.setLevel(7);
    toast.info("지도를 초기화했습니다.");
  };

  // 필터 상태 변경 감지 및 자동 적용
  useEffect(() => {
    console.log("🔍 필터 상태 변경 감지:", filters);
    applyFilters();
  }, [filters]);

  // 필터 변경 핸들러
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 매물 유형 필터 버튼 클릭 핸들러
  const handleTypeFilter = (type) => {
    console.log("🔍 매물 유형 필터 클릭:", type);
    setFilters((prev) => ({
      ...prev,
      type: prev.type === type ? "" : type,
    }));
  };

  // 필터 적용 함수
  const applyFilters = async () => {
    try {
      console.log("🔍 현재 필터 상태:", filters);
      const queryParams = new URLSearchParams();

      // 필터가 정의되어 있고 null이 아닌 경우에만 추가
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
      if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
      if (filters.minPyung) queryParams.append("minPyung", filters.minPyung);
      if (filters.maxPyung) queryParams.append("maxPyung", filters.maxPyung);
      if (filters.dong) queryParams.append("dong", filters.dong);
      if (filters.complexName)
        queryParams.append("complexName", filters.complexName);
      if (filters.isVerified !== "")
        queryParams.append("isVerified", filters.isVerified);

      // 월세인 경우에만 보증금과 월세 필터 추가
      if (filters.type === "월세") {
        if (filters.deposit) queryParams.append("deposit", filters.deposit);
        if (filters.monthlyFee)
          queryParams.append("monthlyFee", filters.monthlyFee);
      }

      console.log("🔍 API 요청 파라미터:", queryParams.toString());
      const response = await fetch(
        `/api/property/all-public?${queryParams.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
        console.log("✅ 필터 적용 성공:", data.properties.length, "개 매물");
      } else {
        console.error("❌ 필터 적용 실패:", data.message);
      }
    } catch (error) {
      console.error("❌ 필터 적용 중 오류:", error);
    }
  };

  // 수수료 계산 함수
  const calculateCommission = (
    type,
    price,
    deposit = 0,
    monthlyFee = 0,
    category = "주택" // 기본 주택, 비주택이면 '비주택'
  ) => {
    let rate = 0;
    let max = Infinity;
    let amount = price;

    // 월세인 경우 보증금 + (월세 x 100)
    if (type === "월세") {
      // 💡 월세 환산금액 = 보증금 + (월세 × 100) 후 원화 변환
      amount = (deposit + monthlyFee * 100) * 10000;
    } else {
      amount = price * 10000; // 매매, 전세도 원 단위로 맞춰줘야 정확
    }

    if (category === "비주택") {
      rate = 0.009; // 법적 상한 0.9%
      return {
        rate,
        commission: amount * rate,
        message: "📌 비주택 매물은 최대 0.9% 이내에서 협의 가능합니다.",
      };
    }

    if (type === "매매") {
      if (amount < 50000000) {
        rate = 0.006;
        max = 250000;
      } else if (amount < 200000000) {
        rate = 0.005;
        max = 800000;
      } else {
        rate = 0.004;
        max = 1000000;
      }
    } else if (type === "전세" || type === "월세") {
      if (amount < 50000000) {
        rate = 0.005;
        max = 200000;
      } else if (amount < 100000000) {
        rate = 0.004;
        max = 300000;
      } else {
        rate = 0.003;
        max = 500000;
      }
    }

    return {
      rate,
      commission: Math.min(amount * rate, max),
      message: null,
    };
  };

  return (
    <>
      {/* ✅ 스크립트는 항상 렌더링 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing&autoload=false`}
        strategy="lazyOnload"
        onLoad={() => {
          if (!window.kakao) {
            console.error("카카오맵 스크립트가 제대로 로드되지 않았습니다.");
            return;
          }
          console.log("카카오맵 스크립트 로드 완료!");
          setScriptLoaded(true);

          if (!window.kakao.maps) {
            console.error("카카오맵 maps 객체가 없습니다.");
            return;
          }

          window.kakao.maps.load(() => {
            if (!window.kakao.maps) {
              console.error("카카오맵 SDK 로딩이 실패했습니다.");
              return;
            }
            console.log("카카오맵 SDK 로딩 완료!");
            setSdkLoaded(true);
          });
        }}
        onError={(e) => {
          console.error("카카오맵 스크립트 로드 실패:", e);
          toast.error("카카오맵을 불러오는데 실패했습니다.");
        }}
      />

      {/* ✅ 지도 DOM은 무조건 렌더링 */}
      <div className="relative w-full h-full">
        <div
          ref={mapRef}
          className="w-full h-full absolute top-0 left-0"
          style={{ zIndex: 0 }}
        />

        {/* 지도 위에 떠 있는 UI 레이어 (버튼용) */}
        {mapReady && !showPropertyList && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-auto">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPropertyList(true)}
              className="bg-white border-2 border-green-500 text-green-600 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold hover:bg-green-50 transition-all"
            >
              <Home className="w-5 h-5" />
              진주 실제 매물 보기
              <Shield className="w-4 h-4 text-yellow-500" />
            </motion.button>
          </div>
        )}

        {/* ✅ 로딩 오버레이만 조건부 */}
        {!mapReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
              <p className="text-gray-600">
                {!scriptLoaded
                  ? "카카오맵 스크립트를 불러오는 중..."
                  : !sdkLoaded
                  ? "카카오맵 SDK를 초기화하는 중..."
                  : "지도를 불러오는 중..."}
              </p>
            </div>
          </div>
        )}

        {/* ✅ 실제 지도가 준비되었을 때 나머지 UI */}
        {mapReady && (
          <>
            {/* 지도 오른쪽 옵션 UI */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <KakaoMapViewType map={map} />
              <KakaoMapSettings map={map} />
            </div>

            {/* 매물 리스트 사이드바 */}
            <AnimatePresence>
              {showPropertyList && (
                <motion.div
                  initial={{ x: -400 }}
                  animate={{ x: 0 }}
                  exit={{ x: -400 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="absolute top-0 left-0 w-96 h-full bg-white shadow-lg overflow-hidden z-50"
                >
                  {/* 사이드바 헤더 */}
                  <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-green-700">
                      매물 목록
                    </h2>
                    <button
                      onClick={() => setShowPropertyList(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* 필터 섹션 */}
                  <div className="p-4 border-b">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-green-600" />
                      필터
                    </h3>

                    {/* 매물 유형 필터 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Home className="w-4 h-4 text-green-600" />
                        매물 유형
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTypeFilter("매매")}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            filters.type === "매매"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          매매
                        </button>
                        <button
                          onClick={() => handleTypeFilter("전세")}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            filters.type === "전세"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          전세
                        </button>
                        <button
                          onClick={() => handleTypeFilter("월세")}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            filters.type === "월세"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          월세
                        </button>
                      </div>
                    </div>

                    {/* 가격 범위 슬라이더 */}
                    {filters.type === "월세" ? (
                      <>
                        <DepositRangeSlider
                          filters={filters}
                          setFilters={setFilters}
                        />
                        <MonthlyRentRangeSlider
                          filters={filters}
                          setFilters={setFilters}
                        />
                      </>
                    ) : (
                      <PriceRangeSlider
                        filters={filters}
                        setFilters={setFilters}
                      />
                    )}

                    {/* 단지명 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4 text-green-600" />
                        단지명
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="complexName"
                          value={filters.complexName}
                          onChange={(e) =>
                            handleFilterChange(e.target.name, e.target.value)
                          }
                          placeholder="단지명을 입력하세요"
                          className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      </div>
                    </div>

                    {/* 실매물 여부 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        실매물 여부
                      </label>
                      <select
                        name="isVerified"
                        value={filters.isVerified}
                        onChange={(e) =>
                          handleFilterChange(e.target.name, e.target.value)
                        }
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">전체</option>
                        <option value="true">실매물만</option>
                        <option value="false">일반 매물만</option>
                      </select>
                    </div>

                    {/* 필터 버튼 */}
                    <div className="flex gap-2">
                      <button
                        onClick={applyFilters}
                        className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        필터 적용
                      </button>
                      <button
                        onClick={() => {
                          resetFilters();
                          setShowPropertyList(false);
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* 매물 목록 */}
                  <div className="overflow-y-auto h-[calc(100%-400px)]">
                    {properties.map((property) => (
                      <motion.div
                        key={property.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowPropertyDetail(true);
                        }}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedProperty?.id === property.id
                            ? "bg-green-50"
                            : ""
                        }`}
                      >
                        <div className="flex flex-col gap-2 p-3 bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                          {/* 제목과 실매물 뱃지 */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 truncate">
                              {property.title}
                            </h3>
                            {property.isVerified && (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full whitespace-nowrap">
                                실매물 확인
                              </span>
                            )}
                          </div>

                          {/* 단지명 */}
                          <p className="text-sm text-gray-500 truncate">
                            {property.complexName}
                          </p>

                          {/* 매물 정보 태그들 */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className="bg-gray-200 px-2 py-1  text-xs text-gray-600">
                              {property.type}
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                              {property.dong}동
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                              {property.floor}층
                            </span>
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
                              {property.area}㎡ ({property.pyung}평)
                            </span>
                          </div>

                          {/* 가격 */}
                          <div className="mt-1 text-green-700 text-lg font-bold">
                            {property.type === "월세" ? (
                              <>
                                보증금 {property.deposit}만원 / 월세{" "}
                                {property.monthlyFee}만원
                              </>
                            ) : (
                              <>{property.priceDisplay}원</>
                            )}
                          </div>

                          {/* 설명 */}
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {property.description}
                          </p>

                          {/* 중개사 정보 */}
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                              {property.agent.user.profileImage && (
                                <img
                                  src={property.agent.user.profileImage}
                                  alt={property.agent.user.name}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <span>
                              {property.agent.user.name} (
                              {property.agent.officeName})
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 매물 상세 정보 사이드바 */}
            <AnimatePresence>
              {showPropertyDetail && selectedProperty && (
                <>
                  {console.log("📦 선택된 매물 상세:", selectedProperty)}
                  <motion.div
                    initial={{ x: -400 }}
                    animate={{ x: 0 }}
                    exit={{ x: -400 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="absolute top-0 left-96 w-96 h-full bg-white shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-4 border-b flex justify-between items-center">
                      <button
                        onClick={() => setShowPropertyDetail(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-bold text-green-700">
                        {selectedProperty.complexName}
                      </h2>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-60px)]">
                      <div className="p-4">
                        {/* 가격 정보 */}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {selectedProperty.type}
                          </span>
                          {selectedProperty.type === "월세" ? (
                            <div className="flex flex-col">
                              <span className="text-base text-gray-500">
                                보증금
                              </span>
                              <span className="text-xl font-bold text-green-600 leading-tight">
                                {selectedProperty.deposit}만원
                                <span className="mx-1 text-sm text-gray-400">
                                  /
                                </span>
                                월세 {selectedProperty.monthlyFee}만원
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-green-600">
                              {selectedProperty.priceDisplay}
                            </span>
                          )}
                        </div>

                        {/* 세대 정보 */}
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-4">
                            세대 정보
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">면적</p>
                              <p className="font-medium">
                                {selectedProperty.area}㎡ (
                                {selectedProperty.pyung}평)
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                방수/욕실수
                              </p>
                              <p className="font-medium">
                                {selectedProperty.rooms}개 /{" "}
                                {selectedProperty.bathrooms}개
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">동</p>
                              <p className="font-medium">
                                {selectedProperty.dong}동
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">
                                해당층/총층
                              </p>
                              <p className="font-medium">
                                {selectedProperty.floor}층 /{" "}
                                {selectedProperty.totalFloors}층
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">관리비</p>
                              <p className="font-medium">
                                {selectedProperty.maintenanceFee}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 이미지 슬라이더 */}
                        <div className="mt-6">
                          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={selectedProperty.images[0]}
                              alt={selectedProperty.complexName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* 실매물 확인 및 중개사 정보 */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          {selectedProperty.isVerified && (
                            <div className="flex items-center gap-2 mb-4">
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                실매물 확인
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {selectedProperty.type}
                              </span>
                              <span className="text-lg font-bold text-green-600">
                                {selectedProperty.priceDisplay}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                              <img
                                src={selectedProperty.agent.user.profileImage}
                                alt={selectedProperty.agent.user.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {selectedProperty.agent.user.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {selectedProperty.agent.officeName}
                              </p>
                              <p className="text-xs text-gray-400">
                                등록 매물{" "}
                                {selectedProperty.agent._count.properties}개
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 상세 설명 */}
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-2">
                            상세 설명
                          </h3>
                          <p className="text-gray-600 whitespace-pre-line">
                            {selectedProperty.description}
                          </p>
                        </div>

                        {/* 찜하기 및 문의하기 버튼 */}
                        <div className="mt-6 flex gap-3">
                          <button className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                            <Star className="w-5 h-5" />
                            찜하기
                          </button>
                          <button className="flex-1 bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition">
                            <Phone className="w-5 h-5" />
                            중개사 문의하기
                          </button>
                        </div>

                        {/* 중개수수료 계산기 */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-green-600" />
                            중개수수료 계산기
                          </h3>

                          {selectedProperty && (
                            <>
                              {(() => {
                                const { rate, commission, message } =
                                  calculateCommission(
                                    selectedProperty.type,
                                    selectedProperty.price,
                                    selectedProperty.deposit,
                                    selectedProperty.monthlyFee,
                                    selectedProperty.category
                                  );
                                return (
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      ✅{" "}
                                      <span className="font-bold">
                                        {selectedProperty.type}
                                      </span>{" "}
                                      요율:{" "}
                                      <span className="text-green-600 font-semibold">
                                        {(rate * 100).toFixed(1)}%
                                      </span>
                                    </p>
                                    <p>
                                      💵 예상 수수료:{" "}
                                      <span className="text-green-700 font-bold text-lg">
                                        {commission.toLocaleString()}원
                                      </span>
                                    </p>
                                    {message && (
                                      <p className="text-yellow-600 text-xs mt-2">
                                        {message}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          )}

                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <Info className="w-4 h-4" /> 실매물 등록 시 소비자와
                            협의해 수수료율 조정이 가능합니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  );
};

export default KakaoMap;
