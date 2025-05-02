import React, { useState, useEffect, useRef } from "react";
import { FaMap, FaMountain, FaCar, FaBiking, FaBuilding } from "react-icons/fa";
import jinjuJson from "@/app/json/Jinju.json";
import { toast } from "sonner";

const KakaoMapSettings = ({ map, scriptLoad }) => {
  const [activeOverlays, setActiveOverlays] = useState({
    cadastral: false,
    terrain: false,
    traffic: false,
    bicycle: false,
    districts: false,
  });
  const [polygons, setPolygons] = useState([]);

  useEffect(() => {
    return () => {
      polygons.forEach((polygon) => polygon.setMap(null));
    };
  }, [polygons]);

  useEffect(() => {
    if (activeOverlays.districts && map) {
      drawDistrictPolygons();
    } else if (map) {
      clearDistrictPolygons();
    }
  }, [activeOverlays.districts, map, scriptLoad]);

  if (!map) return null;

  const drawDistrictPolygons = () => {
    if (!map || !scriptLoad || !window.kakao || !window.kakao.maps) return;

    clearDistrictPolygons();

    const newPolygons = [];

    if (jinjuJson && jinjuJson.geometries) {
      jinjuJson.geometries.forEach((geometry) => {
        if (geometry.type === "Polygon") {
          geometry.coordinates.forEach((ring) => {
            const path = ring.map((coord) => {
              const x = coord[0];
              const y = coord[1];

              const lng = (x - 1050000) / 100000 + 128.0;
              const lat = (y - 1685000) / 100000 + 35.1;

              return new window.kakao.maps.LatLng(lat, lng);
            });

            const polygon = new window.kakao.maps.Polygon({
              path: path,
              strokeWeight: 2,
              strokeColor: "#004c80",
              strokeOpacity: 0.8,
              fillColor: "#004c80",
              fillOpacity: 0.2,
            });

            polygon.setMap(map);
            newPolygons.push(polygon);
          });
        } else if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach((polygonCoords) => {
            polygonCoords.forEach((ring) => {
              const path = ring.map((coord) => {
                const x = coord[0];
                const y = coord[1];
                const lng = (x - 1050000) / 100000 + 128.0;
                const lat = (y - 1685000) / 100000 + 35.1;
                return new window.kakao.maps.LatLng(lat, lng);
              });

              const polygon = new window.kakao.maps.Polygon({
                path: path,
                strokeWeight: 2,
                strokeColor: "#004c80",
                strokeOpacity: 0.8,
                fillColor: "#004c80",
                fillOpacity: 0.2,
              });

              polygon.setMap(map);
              newPolygons.push(polygon);
            });
          });
        }
      });
    }

    setPolygons(newPolygons);
  };

  const clearDistrictPolygons = () => {
    polygons.forEach((polygon) => polygon.setMap(null));
    setPolygons([]);
  };

  const handleCadastralToggle = () => {
    if (map) {
      if (activeOverlays.cadastral) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        setActiveOverlays((prev) => ({ ...prev, cadastral: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        setActiveOverlays((prev) => ({ ...prev, cadastral: true }));
      }
    }
  };

  const handleTerrainToggle = () => {
    if (map) {
      if (activeOverlays.terrain) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.TERRAIN);
        setActiveOverlays((prev) => ({ ...prev, terrain: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TERRAIN);
        setActiveOverlays((prev) => ({ ...prev, terrain: true }));
      }
    }
  };

  const handleTrafficToggle = () => {
    if (map) {
      if (activeOverlays.traffic) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
        setActiveOverlays((prev) => ({ ...prev, traffic: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
        setActiveOverlays((prev) => ({ ...prev, traffic: true }));
      }
    }
  };

  const handleBicycleToggle = () => {
    if (map) {
      if (activeOverlays.bicycle) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.BICYCLE);
        setActiveOverlays((prev) => ({ ...prev, bicycle: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.BICYCLE);
        setActiveOverlays((prev) => ({ ...prev, bicycle: true }));
      }
    }
  };

  const handleDistrictsToggle = () => {
    setActiveOverlays((prev) => ({ ...prev, districts: !prev.districts }));
  };

  return (
    <div className="absolute top-58 right-3 z-9999 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-1">
      <div className="flex flex-col gap-2">
        <button
          onClick={handleCadastralToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.cadastral ? "bg-blue-100" : "bg-white"
          }`}
          title="지적편집도"
          type="button"
        >
          <FaMap
            className={`${
              activeOverlays.cadastral ? "text-blue-700" : "text-blue-600"
            }`}
          />
        </button>

        <button
          onClick={handleTerrainToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.terrain ? "bg-green-100" : "bg-white"
          }`}
          title="지형정보"
          type="button"
        >
          <FaMountain
            className={`${
              activeOverlays.terrain ? "text-green-700" : "text-green-600"
            }`}
          />
        </button>

        <button
          onClick={handleTrafficToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.traffic ? "bg-red-100" : "bg-white"
          }`}
          title="교통정보"
          type="button"
        >
          <FaCar
            className={`${
              activeOverlays.traffic ? "text-red-700" : "text-red-600"
            }`}
          />
        </button>

        <button
          onClick={handleBicycleToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.bicycle ? "bg-purple-100" : "bg-white"
          }`}
          title="자전거도로"
          type="button"
        >
          <FaBiking
            className={`${
              activeOverlays.bicycle ? "text-purple-700" : "text-purple-600"
            }`}
          />
        </button>

        <button
          onClick={handleDistrictsToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.districts ? "bg-orange-100" : "bg-white"
          }`}
          title="행정구역"
          type="button"
        >
          <FaBuilding
            className={`${
              activeOverlays.districts ? "text-orange-700" : "text-orange-600"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default KakaoMapSettings;
