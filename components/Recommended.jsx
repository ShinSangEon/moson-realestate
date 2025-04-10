"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const listings = [
  {
    id: 1,
    title: "🌿 모손빌 원룸",
    address: "진주시 초전동 123-4",
    price: "월세 35 / 5",
    image: "/images/house1.jpg",
  },
  {
    id: 2,
    title: "🌇 리버뷰 투룸",
    address: "진주시 평거동 88-1",
    price: "전세 9,000",
    image: "/images/house2.jpg",
  },
  {
    id: 3,
    title: "🛍️ 상가 임대 - 중심상권",
    address: "진주시 중앙동 11-22",
    price: "월세 200 / 2,000",
    image: "/images/house3.jpg",
  },
];

export default function Recommended() {
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">
          오늘의 모손 추천 매물 🏡
        </h2>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((listing) => (
            <motion.div
              key={listing.id}
              whileHover={{ scale: 1.03 }}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
            >
              <img
                src={listing.image}
                alt={listing.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {listing.title}
                  </h3>
                  <button className="text-gray-400 hover:text-red-500">
                    <Heart size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-500">{listing.address}</p>
                <p className="text-green-600 font-bold mt-2">{listing.price}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
