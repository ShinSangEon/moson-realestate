"use client";

import { useEffect } from "react";

const KakaoPolygonOverlay = ({ map, selectedComplexCode }) => {
  useEffect(() => {
    if (!map || !selectedComplexCode || !window.kakao) return;

    let polygons = [];

    const loadPolygon = async () => {
      try {
        const res = await fetch("/json/jinju-apartment.geojson");
        const geojson = await res.json();

        const feature = geojson.features.find(
          (f) => f.properties.complexCode === selectedComplexCode
        );

        if (!feature) {
          console.warn("📭 해당 단지 폴리곤 없음:", selectedComplexCode);
          return;
        }

        const { geometry, properties } = feature;

        const drawPolygon = (coords) => {
          const path = coords.map(
            ([lng, lat]) => new window.kakao.maps.LatLng(lat, lng)
          );

          const polygon = new window.kakao.maps.Polygon({
            path,
            strokeWeight: 2,
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            fillColor: "#FF0000",
            fillOpacity: 0.3,
          });

          polygon.setMap(map);
          polygons.push(polygon);

          window.kakao.maps.event.addListener(polygon, "click", () => {
            const content = `
              <div style="padding:10px; font-size:13px; line-height:1.5;">
                🏢 <strong>${properties.name}</strong><br/>
                💰 ${properties.price || "가격 정보 없음"}<br/>
                🔗 <a href="/apt/${
                  properties.complexCode
                }" target="_blank" style="color:blue; text-decoration:underline;">상세 보기</a>
              </div>
            `;
            const infoWindow = new window.kakao.maps.InfoWindow({
              position: path[0],
              content,
            });
            infoWindow.open(map);
          });
        };

        if (geometry.type === "Polygon") {
          drawPolygon(geometry.coordinates[0]);
        }

        if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach((polygonGroup) => {
            polygonGroup.forEach((ring) => {
              drawPolygon(ring);
            });
          });
        }
      } catch (err) {
        console.error("❌ GeoJSON 로딩 실패:", err);
      }
    };

    loadPolygon();

    // cleanup
    return () => {
      polygons.forEach((p) => p.setMap(null));
    };
  }, [map, selectedComplexCode]);

  return null;
};

export default KakaoPolygonOverlay;
