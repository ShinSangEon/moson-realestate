"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const AdminFindPage = () => {
  const router = useRouter();
  const [requestsFind, setRequestsFind] = useState([]);
  const [requestsSell, setRequestsSell] = useState([]);
  const [filter, setFilter] = useState("전체");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res1 = await fetch("/api/find/all", {
          credentials: "include",
        });
        if (res1.status === 401 || res1.status === 403) {
          Swal.fire({
            icon: "error",
            title: "접근 불가",
            text: "관리자만 접근 가능한 페이지입니다.",
          });
          return router.push("/login");
        }
        const data1 = await res1.json();
        setRequestsFind(data1.requests);

        const res2 = await fetch("/api/sell/all", {
          credentials: "include",
        });
        const data2 = await res2.json();
        setRequestsSell(data2.requests);
      } catch (err) {
        console.error("요청 목록 불러오기 실패", err);
      }
    };

    fetchAll();
  }, [router]);

  const allRequests = [
    ...requestsFind.map((req) => ({ ...req, category: "구해줘" })),
    ...requestsSell.map((req) => ({ ...req, category: "팔아줘" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredRequests =
    filter === "전체"
      ? allRequests
      : allRequests.filter((req) => req.category === filter);

  const badgeColor = (type) => {
    return type === "구해줘"
      ? "bg-blue-100 text-blue-700 border-blue-300"
      : "bg-red-100 text-red-700 border-red-300";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">📋 전체 요청 목록</h1>

      {/* 필터 버튼 */}
      <div className="flex gap-4 mb-6">
        {["전체", "구해줘", "팔아줘"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full border font-semibold shadow-sm transition ${
              filter === type
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 border">구분</th>
              <th className="px-4 py-2 border">전화번호</th>
              <th className="px-4 py-2 border">종류</th>
              <th className="px-4 py-2 border">거래</th>
              <th className="px-4 py-2 border">예산/가격</th>
              <th className="px-4 py-2 border">위치</th>
              <th className="px-4 py-2 border">입주/판매 시기</th>
              <th className="px-4 py-2 border">작성일</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr
                key={`${req.category}-${req.id}`}
                className="border-t hover:bg-gray-50"
              >
                <td
                  className={`px-4 py-2 border text-center font-bold ${badgeColor(
                    req.category
                  )} rounded-lg`}
                >
                  {req.category}
                </td>
                <td className="px-4 py-2 border">{req.phone}</td>
                <td className="px-4 py-2 border">
                  {req.types || req.propertyType}
                </td>
                <td className="px-4 py-2 border">{req.dealType}</td>
                <td className="px-4 py-2 border">{req.budget || req.price}</td>
                <td className="px-4 py-2 border">{req.location}</td>
                <td className="px-4 py-2 border">
                  {req.moveIn || req.sellTime || "-"}
                </td>
                <td className="px-4 py-2 border">
                  {new Date(req.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRequests.length === 0 && (
          <p className="mt-6 text-center text-gray-500">
            표시할 요청이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminFindPage;
