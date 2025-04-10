"use client";

import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const KakaoAbstractOverlay = ({ position, map, scriptLoad, imageSrc, onClick }) => {
  const [trackerVisible, setTrackerVisible] = useState(false);
  const [trackerPosition, setTrackerPosition] = useState({ x: 0, y: 0 });
  const [trackerAngle, setTrackerAngle] = useState(0);
  
  const BOUNDS_BUFFER = 30;
  const CLIP_BUFFER = 40;
  
  const OUTCODE = {
    INSIDE: 0,
    TOP: 8,
    RIGHT: 2,
    BOTTOM: 4,
    LEFT: 1,
  };

  const getAngle = (center, target) => {
    const dx = target.x - center.x;
    const dy = center.y - target.y;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    return ((-deg + 360) % 360 | 0) + 90;
  };

  const getClipPosition = (top, right, bottom, left, inner, outer) => {
    const calcOutcode = (x, y) => {
      let outcode = OUTCODE.INSIDE;

      if (x < left) {
        outcode |= OUTCODE.LEFT;
      } else if (x > right) {
        outcode |= OUTCODE.RIGHT;
      }

      if (y < top) {
        outcode |= OUTCODE.TOP;
      } else if (y > bottom) {
        outcode |= OUTCODE.BOTTOM;
      }

      return outcode;
    };

    let ix = inner.x;
    let iy = inner.y;
    let ox = outer.x;
    let oy = outer.y;

    let code = calcOutcode(ox, oy);

    while (true) {
      if (!code) {
        break;
      }

      if (code & OUTCODE.TOP) {
        ox = ox + ((ix - ox) / (iy - oy)) * (top - oy);
        oy = top;
      } else if (code & OUTCODE.RIGHT) {
        oy = oy + ((iy - oy) / (ix - ox)) * (right - ox);
        ox = right;
      } else if (code & OUTCODE.BOTTOM) {
        ox = ox + ((ix - ox) / (iy - oy)) * (bottom - oy);
        oy = bottom;
      } else if (code & OUTCODE.LEFT) {
        oy = oy + ((iy - oy) / (ix - ox)) * (left - ox);
        ox = left;
      }

      code = calcOutcode(ox, oy);
    }

    return { x: ox, y: oy };
  };

  const extendBounds = (bounds, proj) => {
    const sw = proj.pointFromCoords(bounds.getSouthWest());
    const ne = proj.pointFromCoords(bounds.getNorthEast());

    sw.x -= BOUNDS_BUFFER;
    sw.y += BOUNDS_BUFFER;

    ne.x += BOUNDS_BUFFER;
    ne.y -= BOUNDS_BUFFER;

    return new window.kakao.maps.LatLngBounds(
      proj.coordsFromPoint(sw),
      proj.coordsFromPoint(ne)
    );
  };

  const trackMarker = () => {
    if (!map) return;
    
    const proj = map.getProjection();
    const bounds = map.getBounds();
    const positionLatLng = new window.kakao.maps.LatLng(position.lat, position.lng);
    
    const extBounds = extendBounds(bounds, proj);
    
    if (extBounds.contain(positionLatLng)) {
      setTrackerVisible(false);
    } else {
      const pos = proj.containerPointFromCoords(positionLatLng);
      const center = proj.containerPointFromCoords(map.getCenter());
      const sw = proj.containerPointFromCoords(bounds.getSouthWest());
      const ne = proj.containerPointFromCoords(bounds.getNorthEast());
      
      const top = ne.y + CLIP_BUFFER;
      const right = ne.x - CLIP_BUFFER;
      const bottom = sw.y - CLIP_BUFFER;
      const left = sw.x + CLIP_BUFFER;
      
      const clipPosition = getClipPosition(top, right, bottom, left, center, pos);
      
      setTrackerPosition(clipPosition);
      setTrackerAngle(getAngle(center, pos));
      setTrackerVisible(true);
    }
  };

  useEffect(() => {
    if (!map || !scriptLoad) return;
    
    const hideTracker = () => setTrackerVisible(false);
    
    window.kakao.maps.event.addListener(map, "zoom_start", hideTracker);
    window.kakao.maps.event.addListener(map, "zoom_changed", trackMarker);
    window.kakao.maps.event.addListener(map, "center_changed", trackMarker);
    
    trackMarker();
    
    return () => {
      window.kakao.maps.event.removeListener(map, "zoom_start", hideTracker);
      window.kakao.maps.event.removeListener(map, "zoom_changed", trackMarker);
      window.kakao.maps.event.removeListener(map, "center_changed", trackMarker);
    };
  }, [map, scriptLoad, position.lat, position.lng]);

  return (
    <>
      {trackerVisible && map && ReactDOM.createPortal(
        <div 
          className="absolute cursor-pointer"
          style={{
            left: `${trackerPosition.x}px`,
            top: `${trackerPosition.y}px`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
          onClick={onClick}
        >
          <div 
            className="flex items-center justify-center bg-white rounded-full p-1 shadow-md border border-gray-300"
            style={{
              transform: `rotate(${trackerAngle}deg)`,
            }}
          >
            <img 
              src={imageSrc} 
              alt="Tracker" 
              className="w-10 h-10 object-cover rounded-full"
            />
          </div>
        </div>,
        map.getNode()
      )}
    </>
  );
};

export default KakaoAbstractOverlay;
