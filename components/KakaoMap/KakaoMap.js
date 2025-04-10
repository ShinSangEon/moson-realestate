"use client";

// React에서 필요한 기능들 불러오기
import { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { toast } from "sonner"; // 알림창 띄우는 기능
import { FaLandmark } from "react-icons/fa"; // 랜드마크 아이콘
import hallImage from "@/app/assets/hall.webp"; // 진주시청 이미지
import Script from "next/script"; // 스크립트 삽입기능

// 만든 버튼, 컨트롤 등 다양한 지도 관련 기능을 불러오기
import MapTypeButton from "./MapTypeButton";
import ZoomControls from "./ZoomControls";
import KakaoMapSettings from "./KakaoMapSettings";
import KakaoAbstractOverlay from "./KakaoAbstractOverlay";
import KakaoMapViewType from "./KakaoMapViewType";

const KakaoMap = () => {
  // 지도가 준비됐는지 확인하는 상태
  const [scriptLoad, setScriptLoad] = useState(false);

  // 마커 위 설명창을 열지 닫을지 결정하는 상태
  const [isOpen, setIsOpen] = useState(false);

  // 기본 지도의 위치를 정해줘 (진주시)
  const defaultPosition = { lat: 35.1803, lng: 128.1087 };

  // 지도 인스턴스를 담는 상태
  const [map, setMap] = useState(null);

  // 지도 타입 (일반 지도 또는 위성 지도)
  const [mapType, setMapType] = useState("ROADMAP");

  // 어떤 마커(표시)를 지도에 띄울지 결정하는 상태
  const [activeOverlays, setActiveOverlays] = useState({
    apartment: false,
  });

  // 마커 종류 선택 상태 (아파트 등)
  const [markerType, setMarkerType] = useState("apartment");

  // 지도를 화면에 띄우기 위한 Kakao 지도 스크립트 로딩하기
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY; // API 키

    if (!apiKey) {
      toast.error("Kakao API Key가 없습니다", { duration: 1000 });
      return;
    }

    // 카카오 지도 스크립트 생성
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer,drawing&autoload=false`;
    script.async = true;

    // 지도가 잘 로딩되었을 때
    script.onload = () => {
      window.kakao.maps.load(() => {
        toast.success("카카오 맵이 로드되었습니다", { duration: 1000 });
        setScriptLoad(true);
      });
    };

    // 로딩 중 에러가 났을 때
    script.onerror = () => {
      toast.error("카카오 맵 로드에 실패했습니다", { duration: 1000 });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 마커를 클릭했을 때의 동작
  const handleMarkerClick = () => {
    toast.info("카카오 맵에 오신 것을 환영합니다!", { duration: 1000 });
    if (map) {
      map.panTo(
        new window.kakao.maps.LatLng(defaultPosition.lat, defaultPosition.lng)
      );
    }
  };

  // 지도를 확대하는 기능
  const handleZoomIn = () => {
    if (map) map.setLevel(map.getLevel() - 1);
  };

  // 지도를 축소하는 기능
  const handleZoomOut = () => {
    if (map) map.setLevel(map.getLevel() + 1);
  };

  // 지도 타입을 일반 또는 위성지도로 변경하는 기능
  const handleMapTypeChange = () => {
    if (map) {
      setMapType((prev) => (prev === "ROADMAP" ? "SKYVIEW" : "ROADMAP"));
      map.setMapTypeId(
        mapType === "ROADMAP"
          ? window.kakao.maps.MapTypeId.HYBRID
          : window.kakao.maps.MapTypeId.ROADMAP
      );
    }
  };

  // 지도의 중심 위치로 다시 돌아가는 기능
  const handleTrackerClick = () => {
    if (map)
      map.panTo(
        new window.kakao.maps.LatLng(defaultPosition.lat, defaultPosition.lng)
      );
  };

  // 카카오 지도가 로딩 완료되면 실제 지도 생성
  const onKakaoMapLoad = () => {
    window.kakao.maps.load(() => {
      try {
        const mapContainer = document.getElementById("map");
        const mapOptions = {
          center: new window.kakao.maps.LatLng(35.180344, 128.107897),
          level: 7,
        };

        const newMap = new window.kakao.maps.Map(mapContainer, mapOptions);
        setMap(newMap);
      } catch (error) {
        toast.error("카카오 맵을 초기화하지 못했습니다", { duration: 1000 });
      }
    });
  };

  return (
    <div className="w-full h-full relative">
      {/* 카카오 지도 로딩 스크립트 */}
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing&autoload=false`}
        onLoad={onKakaoMapLoad}
      />

      {scriptLoad ? (
        <>
          {/* 실제 지도가 표시되는 부분 */}
          <Map
            center={defaultPosition}
            style={{ width: "100%", height: "100%" }}
            level={7}
            onCreate={(mapInstance) => setMap(mapInstance)}
          >
            {/* 마커를 지도에 표시 */}
            <MapMarker
              position={defaultPosition}
              onClick={handleMarkerClick}
              onMouseOver={() => setIsOpen(true)}
              onMouseOut={() => setIsOpen(false)}
              image={{
                src: hallImage.src,
                size: { width: 50, height: 50 },
                options: { offset: { x: 20, y: 20 } },
              }}
            >
              {/* 마커 위 설명창 */}
              {isOpen && <div>진주시청입니다!</div>}
            </MapMarker>
          </Map>
          {/* 👇 여기부터가 현재 빠져있는 기능들 👇 */}
          <KakaoAbstractOverlay
            position={defaultPosition}
            map={map}
            scriptLoad={scriptLoad}
            imageSrc={hallImage.src}
            onClick={handleTrackerClick}
          />

          <MapTypeButton
            mapType={mapType}
            onMapTypeChange={handleMapTypeChange}
          />

          <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

          <KakaoMapSettings map={map} scriptLoad={scriptLoad} />

          <KakaoMapViewType
            activeOverlays={activeOverlays}
            onApartmentToggle={() =>
              setActiveOverlays((prev) => ({
                ...prev,
                apartment: !prev.apartment,
              }))
            }
            map={map}
            scriptLoad={scriptLoad}
            markerType={markerType}
            onMarkerTypeChange={(type) => setMarkerType(type)}
          />
        </>
      ) : (
        <div>지도를 불러오는 중...</div>
      )}
    </div>
  );
};

export default KakaoMap;
