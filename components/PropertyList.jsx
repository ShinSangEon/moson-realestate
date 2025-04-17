"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/property/all");
        const data = await response.json();

        if (data.success) {
          setProperties(data.properties);
        } else {
          setError("매물 목록을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        setError("서버 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold mb-4">최근 매물</h2>
      {properties.map((property) => (
        <Link
          href={`/property/${property.id}`}
          key={property.id}
          className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              {property.images && JSON.parse(property.images)[0] && (
                <Image
                  src={JSON.parse(property.images)[0]}
                  alt={property.title}
                  fill
                  className="object-cover rounded"
                />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{property.title}</h3>
              <p className="text-sm text-gray-500">{property.address}</p>
              <div className="mt-2">
                <span className="text-lg font-bold text-blue-600">
                  {property.price.toLocaleString()}원
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {property.area}㎡
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
