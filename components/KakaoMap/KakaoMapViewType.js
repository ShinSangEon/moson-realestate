"use client";

import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Map,
  MapMarker,
  MapTypeControl,
  ZoomControl,
} from "react-kakao-maps-sdk";
import { motion } from "framer-motion";

const KakaoMapViewType = ({
  map,
  scriptLoad,
  markerType,
  onMarkerTypeChange,
  zoomLevel: initialZoomLevel,
  apartments,
  isLoading,
}) => {
  const [currentZoomLevel, setCurrentZoomLevel] = useState(
    initialZoomLevel || 3
  );
  const [apartmentList, setApartmentList] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [apartmentClusterer, setApartmentClusterer] = useState(null);
  const apartmentMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [selectedDong, setSelectedDong] = useState("");
  const [dongs, setDongs] = useState([]);
  const [dongBoundary, setDongBoundary] = useState(null);
  const polygons = useRef([]);
  const overlays = useRef([]);
  const [dongOverlays, setDongOverlays] = useState({});
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [markers, setMarkers] = useState([]);
  const mapRef = useRef(null);

  // 행정동별 아파트 그룹화
  const groupApartmentsByDong = (apts) => {
    if (!Array.isArray(apts)) {
      console.error("Invalid apartments data:", apts);
      return {};
    }

    const groups = {};
    apts.forEach((apt) => {
      let dong = "기타";

      // 주소에서 동 추출 시도
      if (apt.details?.address) {
        const dongMatch = apt.details.address.match(/([가-힣]+동)/);
        if (dongMatch) {
          dong = dongMatch[1];
        }
      }

      if (!groups[dong]) {
        groups[dong] = [];
      }
      groups[dong].push(apt);
    });

    return groups;
  };

  useEffect(() => {
    async function fetchDongs() {
      try {
        const res = await fetch("/api/apt/dongs");
        const data = await res.json();
        setDongs(data);
      } catch (err) {
        console.error("동 목록 로딩 오류:", err);
      }
    }
    fetchDongs();
  }, []);

  const fetchDongBoundary = async () => {
    try {
      const res = await fetch("/api/dongData", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setDongBoundary(data);
    } catch (err) {
      console.error("행정동 경계 데이터 불러오기 실패:", err);
      toast.error("행정동 경계 데이터를 불러오지 못했습니다");
    }
  };

  useEffect(() => {
    async function fetchApartments() {
      try {
        setIsDataLoading(true);
        const res = await fetch("/api/apartmentMarker");
        const data = await res.json();
        console.log("아파트 데이터:", data);
        setApartmentList(data);
        toast.success("아파트 데이터를 성공적으로 로드했습니다", {
          duration: 1000,
        });
      } catch (err) {
        console.error("아파트 데이터 로딩 오류:", err);
        toast.error(err.message || "아파트 데이터를 불러오지 못했습니다", {
          duration: 1000,
        });
      } finally {
        setIsDataLoading(false);
      }
    }

    if (map && window.kakao && window.kakao.maps) {
      fetchDongBoundary();
      fetchApartments();
    }
  }, [map]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 이미 로드된 스크립트 확인
    const existingScript = document.querySelector(
      "script[src*='dapi.kakao.com']"
    );
    if (existingScript) {
      if (window.kakao?.maps) {
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => {
        // 클러스터러 초기화
        if (mapRef.current) {
          const newClusterer = new window.kakao.maps.MarkerClusterer({
            map: mapRef.current,
            averageCenter: true,
            minLevel: 3,
          });
          setApartmentClusterer(newClusterer);
        }
      });
    };
    document.head.appendChild(script);

    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !apartmentClusterer) return;

    const createApartmentMarkers = () => {
      if (!apartmentList || apartmentList.length === 0) return;

      const newMarkers = apartmentList.map((apartment) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(
            apartment.latitude,
            apartment.longitude
          ),
          title: apartment.apartmentName,
        });

        const content = `
          <div class="p-2 text-sm">
            <p class="font-bold">${apartment.apartmentName}</p>
            <p class="text-gray-600">${apartment.dong}</p>
            <p class="text-xs text-gray-500">${apartment.roadAddress}</p>
          </div>
        `;

        const infoWindow = new window.kakao.maps.InfoWindow({
          content: content,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          infoWindow.open(mapRef.current, marker);
        });

        return marker;
      });

      setMarkers(newMarkers);
      apartmentClusterer.addMarkers(newMarkers);
    };

    createApartmentMarkers();

    return () => {
      if (apartmentClusterer) {
        apartmentClusterer.clear();
      }
    };
  }, [apartmentList, apartmentClusterer]);

  useEffect(() => {
    if (!mapRef.current) return;

    const zoomChangedHandler = () => {
      const level = mapRef.current.getZoom();
      setCurrentZoomLevel(level);
    };

    window.kakao.maps.event.addListener(
      mapRef.current,
      "zoom_changed",
      zoomChangedHandler
    );

    return () => {
      if (mapRef.current) {
        window.kakao.maps.event.removeListener(
          mapRef.current,
          "zoom_changed",
          zoomChangedHandler
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !apartmentClusterer) return;

    if (currentZoomLevel >= 5) {
      // 줌 레벨이 5 이상일 때는 행정구역 오버레이 표시
      apartmentClusterer.clear();
      setMarkers([]);
    } else {
      // 줌 레벨이 5 미만일 때는 개별 마커 표시
      if (apartmentList && apartmentList.length > 0) {
        const newMarkers = apartmentList.map((apartment) => {
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(
              apartment.latitude,
              apartment.longitude
            ),
            title: apartment.apartmentName,
          });

          const content = `
            <div class="p-2 text-sm">
              <p class="font-bold">${apartment.apartmentName}</p>
              <p class="text-gray-600">${apartment.dong}</p>
              <p class="text-xs text-gray-500">${apartment.roadAddress}</p>
            </div>
          `;

          const infoWindow = new window.kakao.maps.InfoWindow({
            content: content,
          });

          window.kakao.maps.event.addListener(marker, "click", () => {
            infoWindow.open(mapRef.current, marker);
          });

          return marker;
        });

        setMarkers(newMarkers);
        apartmentClusterer.addMarkers(newMarkers);
      }
    }
  }, [currentZoomLevel, apartmentList, apartmentClusterer]);

  if (isLoading || isDataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
        center={{ lat: 35.1796, lng: 128.1076 }}
        style={{ width: "100%", height: "100%" }}
        level={3}
        ref={mapRef}
      >
        <MapTypeControl position={window.kakao.maps.ControlPosition.TOPRIGHT} />
        <ZoomControl position={window.kakao.maps.ControlPosition.RIGHT} />
      </Map>
    </motion.div>
  );
};

export default KakaoMapViewType;
