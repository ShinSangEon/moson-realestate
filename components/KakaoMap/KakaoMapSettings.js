import React, { useState, useEffect, useRef } from "react";
import { FaMap, FaMountain, FaCar, FaBiking, FaBuilding, FaVideo } from "react-icons/fa";
import jinjuJson from "@/app/json/Jinju.json";
import { getCCTVs } from "@/app/library/fetchCCTV";
import cctvImage from "@/app/assets/cctv.webp";
import { toast } from "sonner";

const KakaoMapSettings = ({ map, scriptLoad }) => {
  const [activeOverlays, setActiveOverlays] = useState({
    cadastral: false,
    terrain: false,
    traffic: false,
    bicycle: false,
    districts: false,
    cctv: false
  });
  const [polygons, setPolygons] = useState([]);
  const [cctvs, setCctvs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clusterer, setClusterer] = useState(null);
  const markersRef = useRef([]);

  useEffect(() => {
    return () => {
      polygons.forEach(polygon => polygon.setMap(null));
    };
  }, [polygons]);

  useEffect(() => {
    if (activeOverlays.districts && map) {
      drawDistrictPolygons();
    } else if (map) {
      clearDistrictPolygons();
    }
  }, [activeOverlays.districts, map, scriptLoad]);

  useEffect(() => {
    async function fetchCCTVs() {
      try {
        setLoading(true);
        const data = await getCCTVs();
        setCctvs(data);
        toast.success('CCTV 데이터를 성공적으로 로드했습니다', { duration: 1000 });
      } catch (err) {
        console.error('CCTV 데이터 로딩 오류:', err);
        toast.error(err.message || 'CCTV 데이터를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    }

    fetchCCTVs();
  }, []);

  useEffect(() => {
    if (!map || loading || cctvs.length === 0 || !window.kakao || !window.kakao.maps) return;
    
    if (activeOverlays.cctv) {
      let cancelled = false;
      
      const createMarkers = async () => {
        const markers = [];
        const batchSize = 50; 
        
        const clustererStyles = [
          {
            width: '60px', height: '60px',
            background: 'rgba(0, 76, 128, 0.8)',
            color: '#fff',
            borderRadius: '50%',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '20px',
            padding: '10px 0',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
          },
          {
            width: '70px', height: '70px',
            background: 'rgba(0, 76, 128, 0.9)',
            color: '#fff',
            borderRadius: '50%',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '22px',
            padding: '13px 0',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
          },
          {
            width: '80px', height: '80px',
            background: 'rgba(0, 76, 128, 1)',
            color: '#fff',
            borderRadius: '50%',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '24px',
            padding: '16px 0',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
          }
        ];
        
        const cctvImageSrc = cctvImage.src;
        const imageSize = new window.kakao.maps.Size(24, 24);
        const imageOption = {offset: new window.kakao.maps.Point(12, 12)};
        const markerImage = new window.kakao.maps.MarkerImage(cctvImageSrc, imageSize, imageOption);
        
        const newClusterer = new window.kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 3,
          minClusterSize: 3,
          gridSize: 120,
          disableClickZoom: false,
          styles: clustererStyles,
          calculator: [10, 30, 100],
          texts: (count) => `CCTV<br/>${count}개`
        });
        
        for (let i = 0; i < cctvs.length; i += batchSize) {
          if (cancelled) return;
          
          const batch = cctvs.slice(i, i + batchSize);
          const batchMarkers = batch.map(cctv => {
            if (!cctv.latitude || !cctv.longitude) return null;
            
            const marker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(cctv.latitude, cctv.longitude),
              image: markerImage
            });
            
            window.kakao.maps.event.addListener(marker, 'click', function() {
              const infoContent = `
                <div style="padding:5px;width:200px;">
                  <strong>${cctv.purpose}</strong><br/>
                  주소: ${cctv.address}<br/>
                  카메라: ${cctv.cameraCount}대
                </div>
              `;
              
              const infoWindow = new window.kakao.maps.InfoWindow({
                content: infoContent,
                removable: true
              });
              
              infoWindow.open(map, marker);
            });
            
            return marker;
          }).filter(Boolean);
          
          markers.push(...batchMarkers);
          
          if (batchMarkers.length > 0) {
            newClusterer.addMarkers(batchMarkers);
          }
          
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        if (!cancelled) {
          setClusterer(newClusterer);
          markersRef.current = markers;
          toast.success(`CCTV 마커 ${markers.length}개 표시 완료`);
        }
      };
      
      createMarkers();
      
      return () => {
        cancelled = true;
        if (clusterer) {
          setTimeout(() => {
            clusterer.clear();
            markersRef.current = [];
            toast.info('CCTV 마커를 제거했습니다');
          }, 0);
        }
      };
    } else {
      if (clusterer) {
        setTimeout(() => {
          clusterer.clear();
          markersRef.current = [];
          toast.info('CCTV 마커를 제거했습니다');
        }, 0);
      }
    }
  }, [map, cctvs, loading, activeOverlays.cctv]);

  if (!map) return null;

  const drawDistrictPolygons = () => {
    if (!map || !scriptLoad || !window.kakao || !window.kakao.maps) return;

    clearDistrictPolygons();
    
    const newPolygons = [];
    
    if (jinjuJson && jinjuJson.geometries) {
      jinjuJson.geometries.forEach(geometry => {
        if (geometry.type === "Polygon") {
          geometry.coordinates.forEach(ring => {
            const path = ring.map(coord => {
              const x = coord[0];
              const y = coord[1];
              
              const lng = (x - 1050000) / 100000 + 128.0;
              const lat = (y - 1685000) / 100000 + 35.1;
              
              return new window.kakao.maps.LatLng(lat, lng);
            });
            
            const polygon = new window.kakao.maps.Polygon({
              path: path,
              strokeWeight: 2,
              strokeColor: '#004c80',
              strokeOpacity: 0.8,
              fillColor: '#004c80',
              fillOpacity: 0.2
            });
            
            polygon.setMap(map);
            newPolygons.push(polygon);
          });
        }
        else if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach(polygonCoords => {
            polygonCoords.forEach(ring => {
              const path = ring.map(coord => {
                const x = coord[0];
                const y = coord[1];
                const lng = (x - 1050000) / 100000 + 128.0;
                const lat = (y - 1685000) / 100000 + 35.1;
                return new window.kakao.maps.LatLng(lat, lng);
              });
              
              const polygon = new window.kakao.maps.Polygon({
                path: path,
                strokeWeight: 2,
                strokeColor: '#004c80',
                strokeOpacity: 0.8,
                fillColor: '#004c80',
                fillOpacity: 0.2
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
    polygons.forEach(polygon => polygon.setMap(null));
    setPolygons([]);
  };

  const handleCadastralToggle = () => {
    if (map) {
      if (activeOverlays.cadastral) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        setActiveOverlays(prev => ({ ...prev, cadastral: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.USE_DISTRICT);
        setActiveOverlays(prev => ({ ...prev, cadastral: true }));
      }
    }
  };

  const handleTerrainToggle = () => {
    if (map) {
      if (activeOverlays.terrain) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.TERRAIN);
        setActiveOverlays(prev => ({ ...prev, terrain: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TERRAIN);
        setActiveOverlays(prev => ({ ...prev, terrain: true }));
      }
    }
  };

  const handleTrafficToggle = () => {
    if (map) {
      if (activeOverlays.traffic) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
        setActiveOverlays(prev => ({ ...prev, traffic: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TRAFFIC);
        setActiveOverlays(prev => ({ ...prev, traffic: true }));
      }
    }
  };

  const handleBicycleToggle = () => {
    if (map) {
      if (activeOverlays.bicycle) {
        map.removeOverlayMapTypeId(window.kakao.maps.MapTypeId.BICYCLE);
        setActiveOverlays(prev => ({ ...prev, bicycle: false }));
      } else {
        map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.BICYCLE);
        setActiveOverlays(prev => ({ ...prev, bicycle: true }));
      }
    }
  };

  const handleDistrictsToggle = () => {
    setActiveOverlays(prev => ({ ...prev, districts: !prev.districts }));
  };

  const handleCCTVToggle = () => {
    setActiveOverlays(prev => ({ ...prev, cctv: !prev.cctv }));
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
          <FaMap className={`${activeOverlays.cadastral ? "text-blue-700" : "text-blue-600"}`} />
        </button>

        <button
          onClick={handleTerrainToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.terrain ? "bg-green-100" : "bg-white"
          }`}
          title="지형정보"
          type="button"
        >
          <FaMountain className={`${activeOverlays.terrain ? "text-green-700" : "text-green-600"}`} />
        </button>

        <button
          onClick={handleTrafficToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.traffic ? "bg-red-100" : "bg-white"
          }`}
          title="교통정보"
          type="button"
        >
          <FaCar className={`${activeOverlays.traffic ? "text-red-700" : "text-red-600"}`} />
        </button>

        <button
          onClick={handleBicycleToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.bicycle ? "bg-purple-100" : "bg-white"
          }`}
          title="자전거도로"
          type="button"
        >
          <FaBiking className={`${activeOverlays.bicycle ? "text-purple-700" : "text-purple-600"}`} />
        </button>

        <button
          onClick={handleDistrictsToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.districts ? "bg-orange-100" : "bg-white"
          }`}
          title="행정구역"
          type="button"
        >
          <FaBuilding className={`${activeOverlays.districts ? "text-orange-700" : "text-orange-600"}`} />
        </button>

        <button
          onClick={handleCCTVToggle}
          className={`p-3 hover:bg-gray-200 transition-colors rounded-md ${
            activeOverlays.cctv ? "bg-indigo-100" : "bg-white"
          }`}
          title="CCTV"
          type="button"
        >
          <FaVideo className={`${activeOverlays.cctv ? "text-indigo-700" : "text-indigo-600"}`} />
        </button>
      </div>
    </div>
  );
};

export default KakaoMapSettings;
