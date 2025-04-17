"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    price: "",
    area: "",
    maintenanceFee: "",
    floor: "",
    direction: "",
    description: "",
    images: [""],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // API 키는 환경 변수로 관리하는 것이 좋습니다
      const response = await fetch("http://localhost:3000/api/property/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify({
          properties: [
            {
              ...formData,
              price: parseInt(formData.price),
              area: parseFloat(formData.area),
              maintenanceFee: parseInt(formData.maintenanceFee),
              floor: parseInt(formData.floor),
            },
          ],
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("매물이 성공적으로 등록되었습니다!");
        setFormData({
          title: "",
          address: "",
          price: "",
          area: "",
          maintenanceFee: "",
          floor: "",
          direction: "",
          description: "",
          images: [""],
        });
      } else {
        alert("매물 등록에 실패했습니다: " + result.message);
      }
    } catch (error) {
      console.error("매물 등록 중 오류 발생:", error);
      alert("매물 등록 중 오류가 발생했습니다.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">매물 등록</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              제목
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              주소
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                가격
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                면적
              </label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                관리비
              </label>
              <input
                type="number"
                name="maintenanceFee"
                value={formData.maintenanceFee}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                층수
              </label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              방향
            </label>
            <input
              type="text"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              이미지 URL
            </label>
            <input
              type="text"
              name="images"
              value={formData.images[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  images: [e.target.value],
                }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            매물 등록
          </button>
        </form>
      </div>
    </main>
  );
}
