"use client";

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
} from "lucide-react";

import KakaoMapSettings from "./KakaoMapSettings";
import KakaoAbstractOverlay from "./KakaoAbstractOverlay";
import MapTypeButton from "./MapTypeButton";
import ZoomControls from "./ZoomControls";
import KakaoMapViewType from "./KakaoMapViewType";
import KakaoPolygonOverlay from "./KakaoPolygonOverlay";

const defaultPosition = { lat: 35.1803, lng: 128.1087 };

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
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch("/api/property/all");
        if (!res.ok) {
          throw new Error("매물 데이터를 불러오는데 실패했습니다.");
        }
        const data = await res.json();
        if (data.success) {
          setProperties(data.properties);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error("매물 데이터 불러오기 실패:", err);
        toast.error("매물 데이터를 불러오지 못했습니다");
      }
    };
    fetchProperties();
  }, []);

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

                  {/* 필터 탭 */}
                  <div className="p-4 border-b">
                    <div className="flex gap-2 mb-4">
                      {["매매", "전세", "월세"].map((tab) => (
                        <button
                          key={tab}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            activeTab === tab
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {["아파트", "오피스텔", "빌라", "단독주택"].map(
                        (type) => (
                          <button
                            key={type}
                            className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-colors"
                          >
                            {type}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* 매물 목록 */}
                  <div className="overflow-y-auto h-[calc(100%-120px)]">
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
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">
                                {property.dong}
                              </span>
                              <span className="text-lg font-bold">
                                {property.complexName}
                              </span>
                              {property.isVerified && (
                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                  실매물 확인
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {property.type}
                              </span>
                              <span className="ml-2 text-lg font-bold text-green-600">
                                {property.price.toLocaleString()}원
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {property.area}㎡ ({property.pyung}평) ·{" "}
                              {property.dong}동 {property.floor}층
                            </div>
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                              {property.description}
                            </p>
                          </div>
                          <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={property.images[0]}
                              alt={property.complexName}
                              className="w-full h-full object-cover"
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
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {selectedProperty.type}
                        </span>
                        <span className="text-2xl font-bold text-green-600">
                          {selectedProperty.price.toLocaleString()}원
                        </span>
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
                              {selectedProperty.maintenanceFee.toLocaleString()}
                              원
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
                              {selectedProperty.price.toLocaleString()}원
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                            <img
                              src={selectedProperty.agent.profileImage}
                              alt={selectedProperty.agent.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {selectedProperty.agent.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {selectedProperty.agent.officeName}
                            </p>
                            <p className="text-xs text-gray-400">
                              등록 매물 {selectedProperty.agent.propertyCount}개
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
                        <h3 className="text-lg font-semibold mb-2">
                          중개수수료 계산기
                        </h3>
                        <div className="text-sm text-gray-600">
                          <p>
                            매매가: {selectedProperty.price.toLocaleString()}원
                          </p>
                          <p>수수료율: 0.4%</p>
                          <p className="mt-2 font-semibold">
                            예상 수수료:{" "}
                            {(selectedProperty.price * 0.004).toLocaleString()}
                            원
                          </p>
                        </div>
                      </div>
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
