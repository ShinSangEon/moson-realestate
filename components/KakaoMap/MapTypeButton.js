import React from "react";

const MapTypeButton = ({ mapType, onMapTypeChange }) => {
  return (
    <div className="map-type-control">
      <button
        onClick={onMapTypeChange}
        className="bg-white p-2 border border-gray-300 rounded-md shadow-md hover:bg-gray-100"
      >
        {mapType === "ROADMAP" ? "위성지도" : "일반지도"}
      </button>
    </div>
  );
};

export default MapTypeButton;
