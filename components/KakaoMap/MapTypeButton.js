import React from 'react';

const MapTypeButton = ({ mapType, onMapTypeChange }) => {
  return (
    <div className="absolute top-20 right-4 flex flex-col gap-2">
      <button 
        onClick={onMapTypeChange}
        className="bg-white p-2 border border-gray-300 rounded-md shadow-md hover:bg-gray-100 z-9999"
      >
        {mapType === "ROADMAP" ? "위성지도" : "일반지도"}
      </button>
    </div>
  );
};

export default MapTypeButton; 