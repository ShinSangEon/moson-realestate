import React, { useEffect, useState, useRef } from "react";
import { getApartmentMarkers } from "@/app/library/fetchApartMarker";
import { toast } from "sonner";

const KakaoMapViewType = ({ map, scriptLoad, markerType, onMarkerTypeChange }) => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apartmentClusterer, setApartmentClusterer] = useState(null);
  const apartmentMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    async function fetchApartments() {
      try {
        setLoading(true);
        const data = await getApartmentMarkers();
        setApartments(data);
        toast.success('아파트 데이터를 성공적으로 로드했습니다', { duration: 1000 });
      } catch (err) {
        console.error('아파트 데이터 로딩 오류:', err);
        toast.error(err.message || '아파트 데이터를 불러오지 못했습니다', { duration: 1000 });
      } finally {
        setLoading(false);
      }
    }

    fetchApartments();
  }, []);

  useEffect(() => {
    if (!map || loading || apartments.length === 0 || !window.kakao || !window.kakao.maps) return;
    
    if (!infoWindowRef.current && window.kakao && window.kakao.maps) {
      infoWindowRef.current = new window.kakao.maps.InfoWindow({
        content: '',
        removable: false
      });
    }
    
    if (markerType === "apartment") {
      let cancelled = false;
      
      const createApartmentMarkers = async () => {
        const markers = [];
        const batchSize = 50; 
        
        const clustererStyles = [
          {
            width: '60px', height: '60px',
            background: 'rgba(0, 128, 76, 0.8)',
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
            background: 'rgba(0, 128, 76, 0.9)',
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
            background: 'rgba(0, 128, 76, 1)',
            color: '#fff',
            borderRadius: '50%',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '24px',
            padding: '16px 0',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
          }
        ];
        
        const newClusterer = new window.kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 3,
          minClusterSize: 3,
          gridSize: 120,
          disableClickZoom: false,
          styles: clustererStyles,
          calculator: [10, 30, 100],
          texts: (count) => `아파트<br/>${count}개`
        });
        
        for (let i = 0; i < apartments.length; i += batchSize) {
          if (cancelled) return;
          
          const batch = apartments.slice(i, i + batchSize);
          const batchMarkers = batch.map(apartment => {
            if (!apartment.latitude || !apartment.longitude) return null;
            
            const position = new window.kakao.maps.LatLng(apartment.latitude, apartment.longitude);
            const marker = new window.kakao.maps.Marker({
              position: position,
              clickable: true
            });
            
            window.kakao.maps.event.addListener(marker, 'mouseover', function() {
              const infoContent = `
                <div style="padding:5px;width:200px;">
                  <strong>${apartment.complexName || apartment.complexUniqueId}</strong><br/>
                  위치: ${apartment.latitude}, ${apartment.longitude}
                </div>
              `;
              
              infoWindowRef.current.setContent(infoContent);
              infoWindowRef.current.open(map, marker);
            });
            
            window.kakao.maps.event.addListener(marker, 'mouseout', function() {
              infoWindowRef.current.close();
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
          setApartmentClusterer(newClusterer);
          apartmentMarkersRef.current = markers;
          toast.success(`아파트 마커 ${markers.length}개 표시 완료`, { duration: 1000 });
        }
      };
      
      createApartmentMarkers();
      
      return () => {
        cancelled = true;
        if (apartmentClusterer) {
          setTimeout(() => {
            apartmentClusterer.clear();
            apartmentMarkersRef.current = [];
            if (infoWindowRef.current) {
              infoWindowRef.current.close();
            }
            
            toast.info('아파트 마커를 제거했습니다', { duration: 1000 });
          }, 0);
        }
      };
    } else {
      if (apartmentClusterer) {
        setTimeout(() => {
          apartmentClusterer.clear();
          apartmentMarkersRef.current = [];
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }
          
          // Remove all custom overlays
          document.querySelectorAll('.custom-marker').forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
          
          toast.info('아파트 마커를 제거했습니다', { duration: 1000 });
        }, 0);
      }
    }
  }, [map, apartments, loading, markerType, scriptLoad]);

  return (
    <div className="absolute top-20 left-4 md:left-10 z-9999 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-2">
      <select 
        className="p-2 border border-gray-300 rounded-md bg-white text-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={markerType}
        onChange={(e) => onMarkerTypeChange(e.target.value)}
      >
        <option value="apartment">아파트</option>
      </select>
    </div>
  );
};

export default KakaoMapViewType;
