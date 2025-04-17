"use client";

import { useEffect, useState } from "react";
import {
  Map,
  MapMarker,
  MapTypeControl,
  ZoomControl,
  CustomOverlayMap,
} from "react-kakao-maps-sdk";
import { motion } from "framer-motion";

const KakaoMiniMap = ({ address, dong }) => {
  const [position, setPosition] = useState({ lat: 0, lng: 0 });
  const [nearbyFacilities, setNearbyFacilities] = useState([]);
  const [nearbySchools, setNearbySchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    // 카카오맵 스크립트가 로드되었는지 확인
    if (!window.kakao?.maps?.services) {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      };
      document.head.appendChild(script);
    } else {
      initializeMap();
    }
  }, [address]);

  const initializeMap = () => {
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        setPosition({ lat: coords.getLat(), lng: coords.getLng() });
        searchNearbyFacilities(coords);
      } else {
        setLoading(false);
      }
    });
  };

  const searchNearbyFacilities = (center) => {
    const places = new window.kakao.maps.services.Places();
    const categories = [
      { code: "CS2", name: "편의점", icon: "🏪" },
      { code: "HP8", name: "병원", icon: "🏥" },
      { code: "SC4", name: "학교", icon: "🏫" },
      { code: "SW8", name: "지하철역", icon: "🚇" },
      { code: "BK9", name: "은행", icon: "🏦" },
    ];

    const allFacilities = [];
    const schools = [];
    let searchCount = 0;

    categories.forEach((category) => {
      places.categorySearch(
        category.code,
        (data, status) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const facilities = data.slice(0, 3).map((place) => {
              // 거리 계산
              const distance = calculateDistance(
                center.getLat(),
                center.getLng(),
                place.y,
                place.x
              );
              const drivingTime = Math.round((distance / 1000) * 2); // 대략적인 운전 시간 (분)

              const facility = {
                ...place,
                category: category.name,
                icon: category.icon,
                distance: distance,
                drivingTime: drivingTime,
              };

              // 학교인 경우 schools 배열에 추가
              if (
                category.code === "SC4" &&
                place.place_name.includes("학교")
              ) {
                const schoolType = place.place_name.includes("초등학교")
                  ? "초등학교"
                  : place.place_name.includes("중학교")
                  ? "중학교"
                  : place.place_name.includes("고등학교")
                  ? "고등학교"
                  : "기타";

                schools.push({
                  ...facility,
                  schoolType: schoolType,
                });
              }

              return facility;
            });
            allFacilities.push(...facilities);
          }
          searchCount++;
          if (searchCount === categories.length) {
            setNearbyFacilities(allFacilities);
            setNearbySchools(
              schools.filter((school) => school.drivingTime <= 10)
            ); // 10분 이내 학교만
            setLoading(false);
          }
        },
        {
          location: center,
          radius: 2000, // 2km 반경으로 확대
          sort: window.kakao.maps.services.SortBy.DISTANCE,
        }
      );
    });
  };

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 지구의 반경 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // 미터 단위로 반환
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative h-full"
    >
      <Map
        center={position}
        style={{ width: "100%", height: "100%" }}
        level={4}
        className="rounded-2xl"
      >
        <MapTypeControl position={window.kakao.maps.ControlPosition.TOPRIGHT} />
        <ZoomControl position={window.kakao.maps.ControlPosition.RIGHT} />

        {/* 아파트 마커 */}
        <MapMarker
          position={position}
          image={{
            src: "/marker_apartment.svg",
            size: { width: 30, height: 30 },
          }}
        />
        <CustomOverlayMap position={position} yAnchor={2.2}>
          <div className="p-1.5 text-xs bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-blue-100">
            <p className="font-semibold text-blue-700 whitespace-nowrap">
              {dong}
            </p>
          </div>
        </CustomOverlayMap>

        {/* 주변 시설 마커들 */}
        {nearbyFacilities.map((facility, index) => (
          <div key={index}>
            <MapMarker
              position={{ lat: facility.y, lng: facility.x }}
              image={{
                src:
                  facility.category === "편의점"
                    ? "/marker_convenience.svg"
                    : facility.category === "병원"
                    ? "/marker_hospital.svg"
                    : facility.category === "학교"
                    ? "/marker_school.svg"
                    : "/marker_bank.svg",
                size: { width: 30, height: 30 },
              }}
            />
            <CustomOverlayMap
              position={{ lat: facility.y, lng: facility.x }}
              yAnchor={2.2}
            >
              <div className="p-1.5 text-xs bg-white/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-xs">{facility.icon}</span>
                  <p className="font-semibold whitespace-nowrap">
                    {facility.category === "편의점" ? (
                      <span className="text-blue-700">
                        {facility.place_name}
                      </span>
                    ) : facility.category === "병원" ? (
                      <span className="text-teal-700">
                        {facility.place_name}
                      </span>
                    ) : facility.category === "학교" ? (
                      <span className="text-purple-700">
                        {facility.place_name}
                      </span>
                    ) : (
                      <span className="text-yellow-700">
                        {facility.place_name}
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-gray-500 text-[10px] mt-0.5 whitespace-nowrap">
                  {facility.category}
                </p>
              </div>
            </CustomOverlayMap>
          </div>
        ))}
      </Map>

      {/* 범례 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg z-10">
        <div className="flex items-center mb-1.5 px-2 py-1 rounded bg-blue-50">
          <img
            src="/marker_apartment.svg"
            alt="아파트"
            className="w-4 h-4 mr-2"
          />
          <span className="text-xs font-medium text-blue-700">아파트</span>
        </div>
        <div className="flex items-center mb-1.5 px-2 py-1 rounded bg-blue-50">
          <img
            src="/marker_convenience.svg"
            alt="편의점"
            className="w-4 h-4 mr-2"
          />
          <span className="text-xs font-medium text-blue-700">편의점</span>
        </div>
        <div className="flex items-center mb-1.5 px-2 py-1 rounded bg-teal-50">
          <img src="/marker_hospital.svg" alt="병원" className="w-4 h-4 mr-2" />
          <span className="text-xs font-medium text-teal-700">병원</span>
        </div>
        <div className="flex items-center mb-1.5 px-2 py-1 rounded bg-purple-50">
          <img src="/marker_school.svg" alt="학교" className="w-4 h-4 mr-2" />
          <span className="text-xs font-medium text-purple-700">학교</span>
        </div>
        <div className="flex items-center px-2 py-1 rounded bg-yellow-50">
          <img src="/marker_bank.svg" alt="은행" className="w-4 h-4 mr-2" />
          <span className="text-xs font-medium text-yellow-700">은행</span>
        </div>
      </div>

      {/* 학교 정보 범례 */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg z-10 max-w-[200px]">
        <div className="text-xs font-medium text-gray-700 mb-2 pb-1 border-b">
          주변 학교 정보 (차량 10분 이내)
        </div>
        {nearbySchools.length > 0 ? (
          nearbySchools.map((school, index) => (
            <div key={index} className="mb-1.5 last:mb-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px]">🏫</span>
                <p className="text-xs font-medium text-purple-700 truncate">
                  {school.place_name}
                </p>
              </div>
              <div className="text-[10px] text-gray-500 pl-4">
                {school.distance < 1000
                  ? `${school.distance}m`
                  : `${(school.distance / 1000).toFixed(1)}km`}
                • 차량 약 {school.drivingTime}분
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500">주변에 학교가 없습니다.</div>
        )}
      </div>
    </motion.div>
  );
};

export default KakaoMiniMap;
