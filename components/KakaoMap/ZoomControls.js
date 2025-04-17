import React from "react";
import { FaPlus, FaMinus } from "react-icons/fa";

const ZoomControls = ({ onZoomIn, onZoomOut }) => {
  return (
    <div className="zoom-control">
      <button
        onClick={onZoomIn}
        className="bg-white p-3 border border-gray-300 rounded-md shadow-md hover:bg-gray-100"
      >
        <FaPlus />
      </button>
      <button
        onClick={onZoomOut}
        className="bg-white p-3 border border-gray-300 rounded-md shadow-md hover:bg-gray-100"
      >
        <FaMinus />
      </button>
    </div>
  );
};

export default ZoomControls;
