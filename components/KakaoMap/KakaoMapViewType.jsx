"use client";

import { useEffect, useRef, useState } from "react";

const KakaoMapViewType = ({ apartments }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedDong, setSelectedDong] = useState(null);
  const overlays = useRef([]);
  const polygons = useRef([]);

  // 행정동별 아파트 그룹화
  const groupApartmentsByDong = (apts) => {
    const groups = {};
    apts.forEach((apt) => {
      const match = apt.address.match(/([가-힣]+동)/);
      const dong = match ? match[1] : "기타";
      if (!groups[dong]) {
        groups[dong] = [];
      }
      groups[dong].push(apt);
    });
    return groups;
  };

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(35.180344, 128.107618),
      level: 5,
    };

    const mapInstance = new window.kakao.maps.Map(mapRef.current, options);
    setMap(mapInstance);
  }, []);

  // 동별 오버레이 생성
  useEffect(() => {
    if (!map || !apartments) return;

    // 기존 오버레이 제거
    overlays.current.forEach((overlay) => overlay.setMap(null));
    overlays.current = [];

    // 행정동별로 그룹화
    const dongGroups = groupApartmentsByDong(apartments);

    // 각 동별로 오버레이 생성
    Object.entries(dongGroups).forEach(([dong, apts]) => {
      // 동의 중심점 계산
      const center = apts.reduce(
        (acc, apt) => {
          return {
            lat: acc.lat + parseFloat(apt.latitude),
            lng: acc.lng + parseFloat(apt.longitude),
          };
        },
        { lat: 0, lng: 0 }
      );

      center.lat /= apts.length;
      center.lng /= apts.length;

      // 커스텀 오버레이 생성
      const content = document.createElement("div");
      content.className = "custom-overlay";
      content.innerHTML = `
        <div style="
          padding: 10px 15px;
          background: rgba(0, 76, 128, 0.8);
          color: white;
          border-radius: 20px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        ">
          ${dong} (${apts.length}개)
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        content: content,
        position: new window.kakao.maps.LatLng(center.lat, center.lng),
        yAnchor: 1.5,
      });

      // 마우스 오버/아웃 효과
      content.onmouseover = () => {
        content.style.transform = "scale(1.1)";
      };
      content.onmouseout = () => {
        content.style.transform = "scale(1)";
      };

      // 클릭 이벤트 추가
      content.onclick = async () => {
        setSelectedDong(dong);

        // 기존 폴리곤 제거
        polygons.current.forEach((polygon) => polygon.setMap(null));
        polygons.current = [];

        try {
          const response = await fetch("/api/apt/dongBoundary");
          const data = await response.json();

          if (data.features && Array.isArray(data.features)) {
            data.features.forEach((feature) => {
              if (feature.geometry.type === "Polygon") {
                const path = feature.geometry.coordinates[0].map(
                  (coord) => new window.kakao.maps.LatLng(coord[1], coord[0])
                );

                const polygon = new window.kakao.maps.Polygon({
                  path: path,
                  strokeWeight: 2,
                  strokeColor: "#004c80",
                  strokeOpacity: 0.8,
                  fillColor: "#fff",
                  fillOpacity: 0.3,
                });

                polygon.setMap(map);
                polygons.current.push(polygon);
              }
            });
          }

          // 해당 동으로 지도 이동
          map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
          map.setLevel(4);
        } catch (error) {
          console.error("경계 데이터 처리 중 오류:", error);
        }
      };

      overlay.setMap(map);
      overlays.current.push(overlay);
    });
  }, [map, apartments]);

  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default KakaoMapViewType;
