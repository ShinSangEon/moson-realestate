"use client";

import { useState } from "react";
import Link from "next/link";
import PropertyList from "./PropertyList";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">모손부동산</h2>
      </div>

      <div className="overflow-y-auto h-[calc(100vh-64px)]">
        <PropertyList />
      </div>
    </div>
  );
}
