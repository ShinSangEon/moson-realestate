import React from 'react';
import { FaPlus, FaMinus } from "react-icons/fa";

const ZoomControls = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="absolute top-32 right-4 flex flex-col gap-2">
      <button 
        onClick={onZoomIn}
        className="bg-white p-3 border border-gray-300 rounded-md shadow-md hover:bg-gray-100 z-9999"
      >
        <FaPlus />
      </button>
      <button 
        onClick={onZoomOut}
        className="bg-white p-3 border border-gray-300 rounded-md shadow-md hover:bg-gray-100 z-9999"
      >
        <FaMinus />
      </button>
    </div>
  );
};

export default ZoomControls; 