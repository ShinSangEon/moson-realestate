"use client";

import { useState } from "react";

export default function ConvertPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData();
    const shpFile = e.target.shp.files[0];
    const dbfFile = e.target.dbf.files[0];

    if (!shpFile || !dbfFile) {
      setMessage("SHP 파일과 DBF 파일이 모두 필요합니다.");
      setLoading(false);
      return;
    }

    formData.append("shp", shpFile);
    formData.append("dbf", dbfFile);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "변환 중 오류가 발생했습니다.");
      }

      if (data.success) {
        setMessage("파일 변환이 완료되었습니다.");
      } else {
        throw new Error(data.error || "변환 중 오류가 발생했습니다.");
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">SHP 파일 변환</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SHP 파일 선택
            </label>
            <input
              type="file"
              name="shp"
              accept=".shp"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DBF 파일 선택
            </label>
            <input
              type="file"
              name="dbf"
              accept=".dbf"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "변환 중..." : "변환하기"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              message.includes("오류")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
