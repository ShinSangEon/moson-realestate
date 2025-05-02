"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { useMediaQuery } from "react-responsive";
import { debounce } from "lodash";

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
  ChartBar,
  Calendar,
} from "lucide-react";

import KakaoMapSettings from "./KakaoMapSettings";

import TransactionChart from "./TransactionChart";
import AgentPreview from "./AgentPreview";

const defaultPosition = { lat: 35.1803, lng: 128.1087 };

const KakaoMap = ({ address, dong }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mapType, setMapType] = useState("ROADMAP");
  const [mapReady, setMapReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(5);
  const [clusterer, setClusterer] = useState(null);
  const [apartmentMarkers, setApartmentMarkers] = useState([]);
  const [currentMarkers, setCurrentMarkers] = useState([]);
  const [complexAvgData, setComplexAvgData] = useState([]);
  const [dongGroups, setDongGroups] = useState({});
  const [transactionData, setTransactionData] = useState([]);
  const [transactionSummaryData, setTransactionSummaryData] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showMarkerDetail, setShowMarkerDetail] = useState(false);
  const [highlightedMarkerId, setHighlightedMarkerId] = useState(null);

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
    minPriceDisplay: "",
    maxPriceDisplay: "",
    minPyung: "",
    maxPyung: "",
    dong: "",
    complexName: "",
    isVerified: "",
  });
  const [selectedDong, setSelectedDong] = useState("");
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [sortOption, setSortOption] = useState("");

  const isMobile = useMediaQuery({ maxWidth: 768 });

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

  // ✅ 평균 데이터 가져오기
  useEffect(() => {
    const loadComplexAvgData = async () => {
      try {
        console.log("📊 평균 데이터 로드 시작");
        const response = await fetch("/api/complexAvg");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("❌ API 호출 실패:", {
            status: response.status,
            error: errorData.error || "알 수 없는 오류",
            responseText: await response
              .text()
              .catch(() => "응답 텍스트를 읽을 수 없음"),
          });
          setComplexAvgData([]);
          return;
        }

        const data = await response.json();
        console.log("📊 API 응답 데이터:", data);

        if (data.success) {
          const avgData = Array.isArray(data.data) ? data.data : [];
          console.log(`📊 로드된 평균 데이터 수: ${avgData.length}`);
          setComplexAvgData(avgData);
        } else {
          console.warn(
            "⚠️ 단지 평균 데이터 로드 실패:",
            data.error || data.message
          );
          setComplexAvgData([]);
        }
      } catch (error) {
        console.error("❌ 단지 평균 데이터 로드 실패:", error);
        setComplexAvgData([]);
      }
    };

    loadComplexAvgData();
  }, []);

  // ✅ 거래 데이터 가져오기
  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        const res = await fetch("/api/transaction");
        const data = await res.json();
        if (data.success) {
          setTransactionData(data.data);
        }
      } catch (err) {
        console.error("📌 거래 데이터 불러오기 실패:", err);
      }
    };
    fetchTransactionData();
  }, []);

  // ✅ 거래 요약 데이터 가져오기
  useEffect(() => {
    const fetchTransactionSummary = async () => {
      try {
        console.log("🔍 거래 요약 데이터 요청 시작");
        const res = await fetch("/api/transaction");
        const data = await res.json();
        console.log("📦 거래 요약 데이터 응답:", {
          success: data.success,
          dataCount: data.data?.length || 0,
          sampleData: data.data?.[0],
          fullData: data.data, // 전체 데이터 구조 확인
        });
        if (data.success) {
          setTransactionSummaryData(data.data);
        }
      } catch (err) {
        console.error("📌 거래 요약 데이터 불러오기 실패:", err);
      }
    };
    fetchTransactionSummary();
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

      // 저장된 마지막 위치 복원
      const lastPosition = localStorage.getItem("lastMapPosition");
      if (lastPosition) {
        try {
          const pos = JSON.parse(lastPosition);
          newMap.setCenter(new window.kakao.maps.LatLng(pos.lat, pos.lng));
          newMap.setLevel(pos.level || 7);
          console.log("📍 저장된 위치로 이동:", pos);
        } catch (err) {
          console.error("❌ 저장된 위치 복원 실패:", err);
        }
      }

      setMap(newMap);
      setMapReady(true);
      console.log("🗺️ 지도 초기화 완료!");
    } catch (err) {
      console.error("❌ 지도 초기화 실패:", err);
      toast.error("지도 초기화에 실패했습니다.");
    }
  }, [scriptLoaded, sdkLoaded, refReady]);

  // ✅ 지도 이동 감지 및 위치 저장
  useEffect(() => {
    if (!map) return;

    const saveMapPosition = () => {
      const center = map.getCenter();
      const level = map.getLevel();
      const position = {
        lat: center.getLat(),
        lng: center.getLng(),
        level: level,
      };
      localStorage.setItem("lastMapPosition", JSON.stringify(position));
    };

    // 지도 이동이 끝날 때마다 위치 저장 및 매물 필터링
    const handleMapMove = () => {
      saveMapPosition();
      filterByViewport();
    };

    // 현재 뷰포트 기준 매물 필터링
    const filterByViewport = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      // 현재 필터링된 매물 중에서 뷰포트 내의 매물만 필터링
      const filteredProperties = properties.filter((property) => {
        const lat = property.lat;
        const lng = property.lng;
        return (
          lat >= sw.getLat() &&
          lat <= ne.getLat() &&
          lng >= sw.getLng() &&
          lng <= ne.getLng()
        );
      });

      setProperties(filteredProperties);
      console.log("📍 뷰포트 내 매물 수:", filteredProperties.length);
    };

    window.kakao.maps.event.addListener(map, "dragend", handleMapMove);
    window.kakao.maps.event.addListener(map, "zoom_changed", handleMapMove);

    return () => {
      window.kakao.maps.event.removeListener(map, "dragend", handleMapMove);
      window.kakao.maps.event.removeListener(
        map,
        "zoom_changed",
        handleMapMove
      );
    };
  }, [map, properties]);

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

  // ✅ 아파트 마커 데이터 가져오기
  useEffect(() => {
    const fetchApartmentMarkers = async () => {
      try {
        const response = await fetch("/api/map/markers");
        if (!response.ok) {
          throw new Error("Failed to fetch markers");
        }
        const data = await response.json();

        // 행정동별로 마커 그룹화
        const groups = data.reduce((acc, marker) => {
          const dong = marker.dong || "기타";
          if (!acc[dong]) {
            acc[dong] = {
              name: dong,
              count: 0,
              markers: [],
              center: { lat: 0, lng: 0 },
            };
          }
          acc[dong].markers.push(marker);
          acc[dong].count++;
          acc[dong].center.lat += parseFloat(marker.lat) || 0;
          acc[dong].center.lng += parseFloat(marker.lng) || 0;
          return acc;
        }, {});

        // 각 그룹의 중심점 계산
        Object.values(groups).forEach((group) => {
          if (group.count > 0) {
            group.center.lat /= group.count;
            group.center.lng /= group.count;
          }
        });

        setDongGroups(groups);
        setApartmentMarkers(data);
      } catch (error) {
        console.error("마커 데이터 가져오기 실패:", error);
        toast.error("마커 데이터를 가져오는데 실패했습니다.");
      }
    };

    fetchApartmentMarkers();
  }, []);

  // ✅ 클러스터 생성 및 마커 표시
  useEffect(() => {
    if (!map || !mapReady || !dongGroups) return;

    // 기존 클러스터 제거
    if (clusterer) {
      clusterer.clear();
    }

    // 기존 마커들 제거
    currentMarkers.forEach((marker) => marker.setMap(null));
    setCurrentMarkers([]);

    // 줌 레벨이 5 이상일 때는 행정동별 클러스터 표시
    if (zoomLevel >= 5) {
      if (!apartmentMarkers.length) {
        console.log("⚠️ 표시할 마커가 없습니다.");
        return;
      }

      // 겹치는 오버레이를 방지하기 위한 그리드 시스템
      const gridSize = zoomLevel >= 6 ? 0.01 : 0.02; // 줌 레벨에 따라 그리드 크기 조정
      const occupiedPositions = new Set();

      // 행정동 텍스트 라벨 생성
      Object.values(dongGroups).forEach((group) => {
        if (!group || !group.center || !group.name) return;

        // 그리드 시스템에 맞춰 위치 조정
        let adjustedLat = Math.round(group.center.lat / gridSize) * gridSize;
        let adjustedLng = Math.round(group.center.lng / gridSize) * gridSize;

        // 이미 해당 위치가 사용 중인 경우 주변 위치 탐색
        let positionKey = `${adjustedLat},${adjustedLng}`;
        let attempts = 0;
        const maxAttempts = 4;

        while (occupiedPositions.has(positionKey) && attempts < maxAttempts) {
          // 시계 방향으로 주변 위치 탐색
          const directions = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0], // 우, 하, 좌, 상
          ];
          const [dx, dy] = directions[attempts % 4];
          adjustedLat =
            Math.round((group.center.lat + dx * gridSize) / gridSize) *
            gridSize;
          adjustedLng =
            Math.round((group.center.lng + dy * gridSize) / gridSize) *
            gridSize;
          positionKey = `${adjustedLat},${adjustedLng}`;
          attempts++;
        }

        // 최대 시도 횟수를 초과한 경우 해당 오버레이를 건너뛰기
        if (attempts >= maxAttempts) {
          console.log(`⚠️ ${group.name} 오버레이를 표시할 수 없습니다.`);
          return;
        }

        occupiedPositions.add(positionKey);

        // 행정동 이름 매칭 로직 개선
        const matched = complexAvgData.find((item) => {
          const groupName = group.name.replace(/동$/, "");
          const itemName = item.name.replace(/동$/, "");
          return groupName === itemName;
        });

        const content = document.createElement("div");
        content.style.cssText = `
          background: white;
          border-radius: 12px;
          padding: 12px;
          font-family: 'Pretendard', sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          min-width: 140px;
          text-align: left;
          color: #1a1a1a;
          font-size: 13px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 0, 0, 0.05);
          opacity: ${zoomLevel >= 6 ? 0.9 : 1};
          transform-origin: center;
        `;

        content.innerHTML = `
          <div class="flex flex-col gap-1.5">
            <div class="text-base font-bold text-gray-900">${group.name}</div>
            <div class="flex items-center gap-1.5 text-xs text-gray-600">
              <span class="w-4 h-4 flex items-center justify-center bg-blue-50 rounded-full text-blue-600 text-xs">🏢</span>
              <span>단지수 <strong class="text-gray-900">${
                group.count
              }</strong>개</span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-600">
              <span class="w-4 h-4 flex items-center justify-center bg-green-50 rounded-full text-green-600 text-xs">💰</span>
              <span>평균 매매가 <strong class="text-gray-900">${
                matched?.avgSale
                  ? Math.round(matched.avgSale / 10000) + "억"
                  : "-"
              }</strong></span>
            </div>
            <div class="flex items-center gap-1.5 text-xs text-gray-600">
              <span class="w-4 h-4 flex items-center justify-center bg-purple-50 rounded-full text-purple-600 text-xs">🔄</span>
              <span>전세가율 <strong class="text-gray-900">${
                matched?.rentRate ?? "-"
              }</strong>%</span>
            </div>
            ${
              matched?.avgSale && matched?.avgRent
                ? `
              <div class="mt-1 flex items-center gap-2">
                <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full flex">
                    <div class="bg-green-500" style="width: ${
                      (matched.avgRent / matched.avgSale) * 100
                    }%"></div>
                    <div class="bg-purple-500" style="width: ${
                      100 - (matched.avgRent / matched.avgSale) * 100
                    }%"></div>
                  </div>
                </div>
                <div class="flex items-center gap-1 text-[10px] text-gray-500">
                  <span class="flex items-center gap-0.5">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    전세
                  </span>
                  <span class="flex items-center gap-0.5">
                    <span class="w-2 h-2 rounded-full bg-purple-500"></span>
                    매매
                  </span>
                </div>
              </div>
            `
                : ""
            }
          </div>
        `;

        // 호버 효과 추가
        content.addEventListener("mouseover", () => {
          content.style.transform = "translateY(-2px) scale(1.05)";
          content.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.12)";
          content.style.zIndex = "1000";
        });

        content.addEventListener("mouseout", () => {
          content.style.transform = "translateY(0) scale(1)";
          content.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
          content.style.zIndex = "1";
        });

        const overlay = new window.kakao.maps.CustomOverlay({
          content: content,
          position: new window.kakao.maps.LatLng(adjustedLat, adjustedLng),
          yAnchor: 0.5,
          zIndex: 1,
        });

        // 클릭 이벤트 추가
        content.addEventListener("click", () => {
          setSelectedDong(group.name);
          const center = new window.kakao.maps.LatLng(
            group.center.lat,
            group.center.lng
          );
          map.panTo(center);
          setTimeout(() => {
            map.setLevel(4);
          }, 300);
        });

        overlay.setMap(map);
        setCurrentMarkers((prev) => [...prev, overlay]);
      });

      return;
    }

    // 줌 레벨이 5 미만일 때는 개별 아파트 마커 표시
    if (!apartmentMarkers.length) {
      console.log("⚠️ 표시할 마커가 없습니다.");
      return;
    }

    // 기존 마커들 제거
    currentMarkers.forEach((marker) => marker.setMap(null));
    setCurrentMarkers([]);

    // 아파트 오버레이 생성
    apartmentMarkers.forEach((marker) => {
      if (!marker.lat || !marker.lng) return;

      // 해당 아파트의 거래 요약 데이터 매칭
      const matchedSummary = transactionSummaryData.find(
        (item) => item.kaptCode === marker.kaptCode
      );

      console.log("🔍 마커 데이터 매칭:", {
        markerKaptCode: marker.kaptCode,
        markerName: marker.complexName,
        matchedSummary,
      });

      const avgSale = matchedSummary?.avgSale;
      const avgRent = matchedSummary?.avgRent;
      const rentRate = matchedSummary?.rentRate;

      // 마커 생성
      const newMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(marker.lat, marker.lng),
        title: marker.complexName,
        markerId: marker.kaptCode,
        image: new window.kakao.maps.MarkerImage(
          "/marker_apartment.svg",
          new window.kakao.maps.Size(32, 32),
          {
            offset: new window.kakao.maps.Point(16, 16),
            alt: marker.complexName,
            shape: "circle",
            coords: "16,16,14",
          }
        ),
        zIndex: 1,
      });

      // 작은 오버레이 컨텐츠 생성
      const smallContent = document.createElement("div");
      smallContent.style.cssText = `
        background: white;
        border-radius: 6px;
        padding: 4px 6px;
        font-family: 'Pretendard', sans-serif;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        min-width: 80px;
        text-align: left;
        color: #1a1a1a;
        font-size: 11px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        pointer-events: none;
      `;

      smallContent.innerHTML = `
        <div class="flex flex-col gap-0.5">
          <div class="font-medium truncate text-xs">${marker.complexName}</div>
          <div class="flex items-center gap-1 text-gray-600">
            <span class="text-[10px]">${
              avgSale ? Math.round(avgSale / 10000) + "억" : "-"
            }</span>
          </div>
        </div>
      `;

      // 작은 오버레이 생성
      const smallOverlay = new window.kakao.maps.CustomOverlay({
        content: smallContent,
        position: new window.kakao.maps.LatLng(marker.lat, marker.lng),
        yAnchor: 1.5,
        zIndex: 2,
      });

      // 큰 오버레이 컨텐츠 생성
      const largeContent = document.createElement("div");
      largeContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 12px;
        font-family: 'Pretendard', sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        min-width: 180px;
        text-align: left;
        color: #1a1a1a;
        font-size: 13px;
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;
        cursor: pointer;
      `;

      largeContent.innerHTML = `
        <div class="flex flex-col gap-1.5">
          <div class="text-base font-bold text-gray-900">${
            marker.complexName
          }</div>
          <div class="flex items-center gap-1.5 text-xs text-gray-600">
            <span class="w-3 h-3 flex items-center justify-center bg-green-50 rounded-full text-green-600 text-[10px]">💰</span>
            <span>매매: <strong class="text-gray-900">${
              avgSale ? Math.round(avgSale / 10000) + "억" : "-"
            }</strong></span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-gray-600">
            <span class="w-3 h-3 flex items-center justify-center bg-purple-50 rounded-full text-purple-600 text-[10px]">🔄</span>
            <span>전세: <strong class="text-gray-900">${
              avgRent ? Math.round(avgRent / 10000) + "억" : "-"
            }</strong></span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-gray-600">
            <span class="w-3 h-3 flex items-center justify-center bg-blue-50 rounded-full text-blue-600 text-[10px]">📊</span>
            <span>전세가율: <strong class="text-blue-600">${
              rentRate ?? "-"
            }%</strong></span>
          </div>
          <div class="pt-1">
            <button class="w-full py-1 px-2 bg-blue-50 text-blue-600 text-[10px] rounded-lg hover:bg-blue-100 transition-colors">
              자세히 보기
            </button>
          </div>
        </div>
      `;

      largeContent.addEventListener("click", () => {
        router.push(`/apt/${marker.kaptCode}`);
      });

      // 큰 오버레이 생성
      const largeOverlay = new window.kakao.maps.CustomOverlay({
        content: largeContent,
        position: new window.kakao.maps.LatLng(marker.lat, marker.lng),
        yAnchor: 1.5,
        zIndex: 3,
      });

      // 작은 오버레이를 항상 표시
      smallOverlay.setMap(map);

      // 마커 hover 이벤트
      window.kakao.maps.event.addListener(newMarker, "mouseover", () => {
        largeOverlay.setMap(map);
        newMarker.setZIndex(3);
        smallOverlay.setMap(null);
      });

      window.kakao.maps.event.addListener(newMarker, "mouseout", () => {
        largeOverlay.setMap(null);
        newMarker.setZIndex(1);
        smallOverlay.setMap(map);
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(newMarker, "click", () => {
        router.push(`/apt/${marker.kaptCode}`);
      });

      // 마커와 오버레이를 지도에 추가
      newMarker.setMap(map);
      setCurrentMarkers((prev) => [
        ...prev,
        newMarker,
        smallOverlay,
        largeOverlay,
      ]);
    });

    return () => {
      currentMarkers.forEach((marker) => {
        if (marker instanceof window.kakao.maps.Marker) {
          marker.setMap(null);
        } else {
          marker.setMap(null);
        }
      });
      setCurrentMarkers([]);
    };
  }, [map, mapReady, apartmentMarkers, zoomLevel, dongGroups]);

  // ✅ 매물 데이터 가져오기
  useEffect(() => {
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
          // 초기 매물 데이터 저장
          setProperties(data.properties);
          setShowPropertyList(true);
          console.log("✅ 매물 데이터 설정 완료");

          // 지도가 준비된 경우 뷰포트 기준 필터링
          if (map) {
            const bounds = map.getBounds();
            const sw = bounds.getSouthWest();
            const ne = bounds.getNorthEast();

            const filteredProperties = data.properties.filter((property) => {
              const lat = property.lat;
              const lng = property.lng;
              return (
                lat >= sw.getLat() &&
                lat <= ne.getLat() &&
                lng >= sw.getLng() &&
                lng <= ne.getLng()
              );
            });

            setProperties(filteredProperties);
            console.log(
              "📍 초기 뷰포트 내 매물 수:",
              filteredProperties.length
            );
          }
        } else {
          throw new Error(data.message || "알 수 없는 오류가 발생했습니다.");
        }
      } catch (err) {
        console.error("❌ 매물 데이터 불러오기 실패:", err);
        toast.error("매물 데이터를 불러오지 못했습니다");
      }
    };
    fetchProperties();
  }, [map]);

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

  // ✅ 지도 이동 애니메이션
  const animateMapMove = (lat, lng) => {
    if (!map) return;

    const currentPosition = map.getCenter();
    const targetPosition = new window.kakao.maps.LatLng(lat, lng);

    // 부드러운 이동을 위한 panTo 사용
    map.panTo(targetPosition);
  };

  // ✅ 내 위치 이동
  const handleCurrentLocation = () => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        animateMapMove(latitude, longitude);
        toast.success("📍 현재 위치로 이동했습니다!");
      },
      () => toast.error("위치 정보를 가져올 수 없습니다")
    );
  };

  // ✅ 지도 초기화
  const handleResetMap = () => {
    if (!map) return;
    animateMapMove(defaultPosition.lat, defaultPosition.lng, 7);
    // 초기화 시 저장된 위치도 삭제
    localStorage.removeItem("lastMapPosition");
    toast.info("지도를 초기화했습니다.");
  };

  // ✅ 행정동 클릭 시 이동
  const handleDongClick = (dong) => {
    if (!map) return;
    const { lat, lng } = dong.center;
    animateMapMove(lat, lng);
    // 행정동 클릭 시에도 위치 저장
    const position = {
      lat,
      lng,
      level: map.getLevel(),
    };
    localStorage.setItem("lastMapPosition", JSON.stringify(position));
  };

  // 한글 금액을 숫자로 변환하는 함수
  const parseKoreanMoney = (str) => {
    let num = 0;
    const eokMatch = str.match(/(\d+)\s*억/);
    const chunMatch = str.match(/(\d+)\s*천/);
    if (eokMatch) num += parseInt(eokMatch[1]) * 100000000;
    if (chunMatch) num += parseInt(chunMatch[1]) * 10000000;
    return num || parseInt(str.replace(/[^0-9]/g, "")); // 숫자만 있으면 그것도
  };

  // 숫자를 한글 금액으로 변환하는 함수
  const formatKoreanMoney = (num) => {
    if (!num) return "";
    const eok = Math.floor(num / 100000000);
    const chun = Math.floor((num % 100000000) / 10000000);
    let result = "";
    if (eok > 0) result += `${eok}억`;
    if (chun > 0) result += `${chun}천`;
    return result || num.toLocaleString();
  };

  // ✅ 필터 초기화 함수
  const resetFilters = () => {
    setFilters({
      type: "",
      minPrice: "",
      maxPrice: "",
      minPriceDisplay: "",
      maxPriceDisplay: "",
      minPyung: "",
      maxPyung: "",
      dong: "",
      complexName: "",
      isVerified: "",
    });
    setSelectedDong("");
    handleResetMap();
  };

  // ✅ debounce된 필터 함수 생성
  const debouncedFilter = useRef(
    debounce(async (filters) => {
      try {
        console.log("🔍 현재 필터 상태:", filters);
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
        console.log("🔍 API 요청 파라미터:", queryParams.toString());

        const res = await fetch(`/api/property/all?${queryParams.toString()}`);
        if (!res.ok) throw new Error("필터 적용 실패");

        const data = await res.json();
        console.log("🔍 API 응답 데이터:", {
          success: data.success,
          propertiesCount: data.properties?.length || 0,
          firstProperty: data.properties?.[0],
        });

        if (data.success) {
          setProperties(data.properties);
          toast.success("필터가 적용되었습니다");
        }
      } catch (error) {
        console.error("❌ 필터 적용 실패:", error);
        toast.error("필터를 적용하는데 실패했습니다");
      }
    }, 500)
  ).current;

  // ✅ 필터 적용 함수
  const applyFilters = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const res = await fetch(`/api/property/all?${queryParams.toString()}`);
      if (!res.ok) throw new Error("필터 적용 실패");

      const data = await res.json();
      if (data.success) {
        setProperties(data.properties);
        toast.success("필터가 적용되었습니다");
      }
    } catch (error) {
      console.error("❌ 필터 적용 실패:", error);
      toast.error("필터를 적용하는데 실패했습니다");
    }
  };

  // ✅ 필터 상태 변경 감지 및 debounce 적용
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      debouncedFilter(filters);
    }
    return () => {
      debouncedFilter.cancel();
    };
  }, [filters, debouncedFilter]);

  // ✅ 필터 변경 핸들러 수정
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log("🔍 필터 변경:", name, value);
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ 매물 유형 필터 버튼 클릭 핸들러 수정
  const handleTypeFilter = (type) => {
    console.log("🔍 매물 유형 필터 클릭:", type);
    setFilters((prev) => ({
      ...prev,
      type: prev.type === type ? "" : type,
    }));
  };

  // ✅ 컴포넌트 언마운트 시 debounce 취소
  useEffect(() => {
    return () => {
      debouncedFilter.cancel();
    };
  }, [debouncedFilter]);

  // 수수료 계산 함수
  const calculateCommission = (type, price) => {
    let rate = 0;
    let max = 0;

    if (type === "매매") {
      if (price < 50000000) {
        rate = 0.005;
        max = price * rate;
      } else if (price < 200000000) {
        rate = 0.004;
        max = price * rate;
      } else if (price < 600000000) {
        rate = 0.003;
        max = price * rate;
      } else if (price < 900000000) {
        rate = 0.005;
        max = price * rate;
      } else if (price < 1200000000) {
        rate = 0.004;
        max = price * rate;
      } else {
        rate = 0.009; // 협의 가능
        max = price * rate;
      }
    } else {
      // 전세나 월세
      if (price < 50000000) {
        rate = 0.005;
        max = price * rate;
      } else if (price < 100000000) {
        rate = 0.004;
        max = price * rate;
      } else if (price < 300000000) {
        rate = 0.003;
        max = price * rate;
      } else if (price < 600000000) {
        rate = 0.004;
        max = price * rate;
      } else if (price < 1200000000) {
        rate = 0.005;
        max = price * rate;
      } else {
        rate = 0.008; // 협의 가능
        max = price * rate;
      }
    }

    return {
      rate,
      commission: Math.min(max, price * rate),
    };
  };

  // 거래 데이터 분석 함수
  const analyzeTransactionData = (complexName) => {
    const complexTransactions = transactionData.filter(
      (t) => t.complexName === complexName
    );

    if (complexTransactions.length === 0) return null;

    const saleTransactions = complexTransactions.filter(
      (t) => t.dealType === "매매"
    );
    const rentTransactions = complexTransactions.filter(
      (t) => t.dealType === "전세"
    );

    const avgSale =
      saleTransactions.length > 0
        ? Math.round(
            saleTransactions.reduce((sum, t) => sum + t.dealAmount, 0) /
              saleTransactions.length
          )
        : null;

    const avgRent =
      rentTransactions.length > 0
        ? Math.round(
            rentTransactions.reduce((sum, t) => sum + t.dealAmount, 0) /
              rentTransactions.length
          )
        : null;

    const rentRate =
      avgSale && avgRent ? Math.round((avgRent / avgSale) * 100) : null;

    return {
      avgSale,
      avgRent,
      rentRate,
      transactionCount: complexTransactions.length,
      lastTransaction: complexTransactions[complexTransactions.length - 1],
    };
  };

  // ✅ 행정동 필터링 함수
  const filterByDong = (dong) => {
    setSelectedDong(dong);
    setFilters((prev) => ({
      ...prev,
      dong: dong,
    }));
    // 해당 행정동으로 지도 이동
    const dongData = dongGroups[dong];
    if (dongData) {
      animateMapMove(dongData.center.lat, dongData.center.lng);
    }
  };

  // ✅ 마커 클릭 핸들러
  const handleMarkerClick = (marker) => {
    // 마커 위치로 부드럽게 이동
    animateMapMove(marker.lat, marker.lng, 4);

    // 해당 아파트의 거래 데이터 필터링
    const aptTransactions = transactionData.filter(
      (t) => t.complexName === marker.complexName
    );

    // 거래 데이터 날짜순 정렬
    const sorted = [...aptTransactions].sort((a, b) => {
      const dateA = new Date(a.dealDate);
      const dateB = new Date(b.dealDate);
      return dateB - dateA;
    });

    const lastTransaction = sorted[0];
    const avgSale =
      aptTransactions
        .filter((t) => t.dealType === "매매")
        .reduce((sum, t) => sum + t.dealAmount, 0) /
      aptTransactions.filter((t) => t.dealType === "매매").length;

    const avgRent =
      aptTransactions
        .filter((t) => t.dealType === "전세")
        .reduce((sum, t) => sum + t.dealAmount, 0) /
      aptTransactions.filter((t) => t.dealType === "전세").length;

    const rentRate =
      avgSale && avgRent ? Math.round((avgRent / avgSale) * 100) : null;

    // 이동 애니메이션 완료 후 상세 정보 표시
    setTimeout(() => {
      setSelectedMarker({
        ...marker,
        transactions: aptTransactions,
        lastTransaction,
        avgSale,
        avgRent,
        rentRate,
      });
      setShowMarkerDetail(true);

      // 마커에 포커스 효과 추가
      const markerElement = document.querySelector(
        `[title="${marker.complexName}"]`
      );
      if (markerElement) {
        markerElement.style.transform = "scale(1.2)";
        markerElement.style.transition = "transform 0.3s ease";
        setTimeout(() => {
          markerElement.style.transform = "scale(1)";
        }, 300);
      }
    }, 400);
  };

  // ✅ 매물 목록 아이템 hover 핸들러
  const handlePropertyHover = (property) => {
    setHighlightedMarkerId(property.kaptCode);
    // 해당 마커로 지도 이동
    const marker = apartmentMarkers.find(
      (m) => m.kaptCode === property.kaptCode
    );
    if (marker) {
      animateMapMove(marker.lat, marker.lng, 4);
    }
  };

  const handlePropertyLeave = () => {
    setHighlightedMarkerId(null);
  };

  // ✅ 단지명 자동완성 데이터 생성
  const complexOptions = useMemo(() => {
    return Array.from(new Set(properties.map((p) => p.complexName)))
      .filter((name) => name) // 빈 값 제거
      .sort(); // 알파벳 순 정렬
  }, [properties]);

  // ✅ 정렬 함수
  const sortProperties = (properties, option) => {
    let sorted = [...properties];
    switch (option) {
      case "price_asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "date":
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "area_asc":
        sorted.sort((a, b) => a.area - b.area);
        break;
      case "area_desc":
        sorted.sort((a, b) => b.area - a.area);
        break;
      case "pyung_asc":
        sorted.sort((a, b) => a.pyung - b.pyung);
        break;
      case "pyung_desc":
        sorted.sort((a, b) => b.pyung - a.pyung);
        break;
      default:
        break;
    }
    return sorted;
  };

  // ✅ 정렬 옵션 변경 핸들러
  const handleSortChange = (e) => {
    const option = e.target.value;
    setSortOption(option);
    const sorted = sortProperties(properties, option);
    setProperties(sorted);
  };

  // ✅ 키보드 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowMarkerDetail(false);
        setShowPropertyDetail(false);
        setShowPropertyList(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ✅ 외부 클릭 시 패널 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMarkerDetail && !e.target.closest(".marker-detail-panel")) {
        setShowMarkerDetail(false);
      }
      if (showPropertyDetail && !e.target.closest(".property-detail-panel")) {
        setShowPropertyDetail(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [showMarkerDetail, showPropertyDetail]);

  // ✅ 필터 변경 시 스크롤 처리
  useEffect(() => {
    const listContainer = document.querySelector(".property-list-scroll");
    if (listContainer) {
      listContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [properties, sortOption]);

  return (
    <>
      <style jsx global>{`
        .marker-card {
          background: white;
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          min-width: 160px;
          text-align: left;
          font-size: 13px;
          font-family: "Pretendard", sans-serif;
          color: #111;
          border: 1px solid #eee;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .marker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
      `}</style>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-auto"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPropertyList(true)}
              className="bg-white border-2 border-green-500 text-green-600 px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold hover:bg-green-50 transition-all"
            >
              <Home className="w-5 h-5" />
              진주 실제 매물 보기
              <Shield className="w-4 h-4 text-yellow-500" />
            </motion.button>
          </motion.div>
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
              <KakaoMapSettings map={map} />
            </div>

            {/* 매물 리스트 사이드바 */}
            <AnimatePresence>
              {showPropertyList && (
                <motion.div
                  initial={isMobile ? { y: "100%" } : { x: "-100%" }}
                  animate={isMobile ? { y: 0 } : { x: 0 }}
                  exit={isMobile ? { y: "100%" } : { x: "-100%" }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className={`
                    fixed z-50 bg-white shadow-lg overflow-hidden
                    ${
                      isMobile
                        ? "bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl"
                        : "top-0 left-0 w-96 h-full"
                    }
                  `}
                >
                  {/* 사이드바 헤더 */}
                  <div className="p-4 border-b flex flex-col gap-2 sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-center">
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

                    {/* 정렬 드롭다운 */}
                    <div className="relative">
                      <select
                        value={sortOption}
                        onChange={handleSortChange}
                        className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
                      >
                        <option value="">정렬 기준 선택</option>
                        <option value="price_asc">가격 낮은순</option>
                        <option value="price_desc">가격 높은순</option>
                        <option value="date">최신 등록순</option>
                        <option value="area_asc">면적 작은순</option>
                        <option value="area_desc">면적 큰순</option>
                        <option value="pyung_asc">평수 작은순</option>
                        <option value="pyung_desc">평수 큰순</option>
                      </select>
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      </div>
                    </div>
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

                    {/* 가격 범위 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        가격 범위
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            name="minPrice"
                            value={filters.minPriceDisplay}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilters((prev) => ({
                                ...prev,
                                minPriceDisplay: value,
                                minPrice: parseKoreanMoney(value),
                              }));
                            }}
                            placeholder="최소 가격 (예: 1억2천)"
                            className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            ₩
                          </span>
                        </div>
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            name="maxPrice"
                            value={filters.maxPriceDisplay}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilters((prev) => ({
                                ...prev,
                                maxPriceDisplay: value,
                                maxPrice: parseKoreanMoney(value),
                              }));
                            }}
                            placeholder="최대 가격 (예: 3억)"
                            className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                            ₩
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 단지명 검색 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4 text-green-600" />
                        단지명
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          list="complexOptions"
                          name="complexName"
                          value={filters.complexName}
                          onChange={handleFilterChange}
                          placeholder="단지명을 입력하세요"
                          className="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <datalist id="complexOptions">
                          {complexOptions.map((name) => (
                            <option key={name} value={name} />
                          ))}
                        </datalist>
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
                        onChange={handleFilterChange}
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
                  <div className="overflow-y-auto h-[calc(100%-200px)] property-list-scroll">
                    {properties.map((property) => (
                      <motion.div
                        key={property.id}
                        whileHover={{ scale: 1.02 }}
                        onMouseEnter={() => handlePropertyHover(property)}
                        onMouseLeave={handlePropertyLeave}
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs animate-pulse">
                                <Shield className="w-3 h-3" />
                                실매물
                              </span>
                            )}
                          </div>

                          {/* 단지명 */}
                          <p className="text-sm text-gray-500 truncate">
                            {property.complexName}
                          </p>

                          {/* 매물 정보 태그들 */}
                          <div className="flex flex-wrap gap-1.5">
                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-600">
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
                                보증금 {property.depositDisplay}만원 / 월세{" "}
                                {property.monthlyDisplay}만원
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
                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 relative">
                            <div
                              className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 cursor-pointer"
                              onMouseEnter={() =>
                                setHoveredAgent(property.agent)
                              }
                              onMouseLeave={() => setHoveredAgent(null)}
                            >
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
                            <AgentPreview
                              agent={property.agent}
                              isVisible={hoveredAgent?.id === property.agent.id}
                            />
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
                <motion.div
                  initial={{ x: -400 }}
                  animate={{ x: 0 }}
                  exit={{ x: -400 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="absolute top-0 left-96 w-96 h-full bg-white shadow-lg overflow-hidden z-50 property-detail-panel"
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
                              {selectedProperty.depositDisplay}만원
                              <span className="mx-1 text-sm text-gray-400">
                                /
                              </span>
                              월세 {selectedProperty.monthlyDisplay}만원
                            </span>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-green-600">
                            {selectedProperty.priceDisplay}원
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
                            <p className="text-sm text-gray-500">방수/욕실수</p>
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
                            <p className="text-sm text-gray-500">해당층/총층</p>
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

                      {/* 거래 차트 섹션 */}
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <ChartBar className="w-5 h-5 text-green-600" />
                          최근 거래 추이
                        </h3>
                        <TransactionChart
                          transactions={transactionData.filter(
                            (t) =>
                              t.complexName === selectedProperty.complexName
                          )}
                        />
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
                              const { rate, commission } = calculateCommission(
                                selectedProperty.type,
                                selectedProperty.price
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
              )}
            </AnimatePresence>

            {/* 마커 상세 정보 카드 */}
            <AnimatePresence>
              {showMarkerDetail && selectedMarker && (
                <motion.div
                  initial={isMobile ? { y: "100%" } : { x: "100%" }}
                  animate={isMobile ? { y: 0 } : { x: 0 }}
                  exit={isMobile ? { y: "100%" } : { x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`
                    fixed z-50 bg-white/95 backdrop-blur-sm shadow-lg overflow-y-auto marker-detail-panel
                    ${
                      isMobile
                        ? "bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl"
                        : "top-0 right-0 w-96 h-full"
                    }
                  `}
                >
                  <div className="p-4 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => setShowMarkerDetail(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedMarker.complexName}
                      </h2>
                      <div className="w-10" />
                    </div>
                  </div>

                  <div className="p-4">
                    {/* 아파트 이미지 */}
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={selectedMarker.thumbnail || "/apt_thumbnail.jpg"}
                        alt={selectedMarker.complexName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 거래 정보 */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">매매가</span>
                        <span className="font-semibold text-gray-900">
                          {selectedMarker.avgSale
                            ? selectedMarker.avgSale.toLocaleString() + "만원"
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">전세가</span>
                        <span className="font-semibold text-gray-900">
                          {selectedMarker.avgRent
                            ? selectedMarker.avgRent.toLocaleString() + "만원"
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">전세가율</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs animate-pulse">
                          <Calculator className="w-3 h-3" />
                          {selectedMarker.rentRate
                            ? selectedMarker.rentRate + "%"
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">최근 거래일</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs animate-pulse">
                          <Calendar className="w-3 h-3" />
                          {selectedMarker.lastTransaction?.dealDate || "-"}
                        </span>
                      </div>
                    </div>

                    {/* 거래 차트 */}
                    {selectedMarker.transactions?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <ChartBar className="w-5 h-5 text-green-600" />
                          최근 거래 추이
                        </h3>
                        <TransactionChart
                          transactions={selectedMarker.transactions}
                        />
                      </div>
                    )}

                    {/* 상세 보기 버튼 */}
                    <div className="mt-6">
                      <button
                        onClick={() =>
                          router.push(`/apt/${selectedMarker.kaptCode}`)
                        }
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        자세히 보기
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </>
  );
};

export default KakaoMap;
