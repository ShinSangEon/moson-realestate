"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaHome,
  FaMapMarkerAlt,
  FaMoneyBillAlt,
  FaExchangeAlt,
  FaStickyNote,
  FaPhone,
  FaComments,
} from "react-icons/fa";
import { toast } from "sonner";
import Swal from "sweetalert2";
const SellProperty = () => {
  const [form, setForm] = useState({
    phone: "",
    types: [],
    typeEtc: "",
    location: "",
    price: "",
    dealType: "매도",
    note: "",
  });

  const [showEtc, setShowEtc] = useState(false);

  const toggleType = (value) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(value)
        ? prev.types.filter((v) => v !== value)
        : [...prev.types, value],
    }));
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.phone.startsWith("010")) {
      Swal.fire({
        icon: "warning",
        title: "전화번호 오류",
        text: "전화번호는 반드시 010으로 시작해야 합니다.",
      });
      return;
    }
    const payload = {
      ...form,
      types: [
        ...form.types,
        showEtc && form.typeEtc ? `기타:${form.typeEtc}` : null,
      ]
        .filter(Boolean)
        .join(","),
    };

    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        Swal.fire({
          icon: "success",
          title: "요청 완료!",
          text: "정상적으로 요청이 접수되었습니다. 빠른 시일 내에 연락드릴게요!",
        });

        setForm({
          phone: "",
          types: [],
          typeEtc: "",
          location: "",
          price: "",
          dealType: "매도",
          note: "",
        });
        setShowEtc(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "요청 실패",
          text: result.message || "요청 처리 중 문제가 발생했습니다.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "요청 실패",
        text: "서버와의 연결 중 문제가 발생했습니다. 다시 시도해주세요.",
      });
    }
  };
  return (
    <motion.div
      className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 왼쪽: 폼 */}
      <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        <h2 className="text-2xl font-bold text-center">
          🧾 팔아줘! 내 물건 등록하기
        </h2>

        <div className="space-y-4">
          <label className="block font-medium flex items-center gap-2">
            <FaPhone /> 연락처
          </label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="010-1234-5678"
            className="w-full px-4 py-2 border rounded-md"
          />

          <label className="block font-medium flex items-center gap-2">
            <FaHome /> 물건 종류
          </label>
          <div className="flex flex-wrap gap-3">
            {["원룸류", "아파트", "상가", "토지"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showEtc}
                onChange={(e) => setShowEtc(e.target.checked)}
              />
              기타
            </label>
          </div>
          {showEtc && (
            <input
              type="text"
              name="typeEtc"
              value={form.typeEtc}
              onChange={handleChange}
              placeholder="기타 종류를 입력해주세요"
              className="w-full mt-2 px-3 py-2 border rounded-md"
            />
          )}

          <label className="block font-medium flex items-center gap-2">
            <FaMapMarkerAlt /> 물건 위치
          </label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="예: 진주시 가좌동"
            className="w-full px-4 py-2 border rounded-md"
          />

          <label className="block font-medium flex items-center gap-2">
            <FaMoneyBillAlt /> 희망 금액
          </label>
          <input
            type="text"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="예: 3억~3억5천"
            className="w-full px-4 py-2 border rounded-md"
          />

          <label className="block font-medium flex items-center gap-2">
            <FaExchangeAlt /> 거래 유형
          </label>
          <div className="flex gap-6">
            {["매도", "임대"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dealType"
                  checked={form.dealType === type}
                  onChange={() =>
                    setForm((prev) => ({ ...prev, dealType: type }))
                  }
                />
                {type}
              </label>
            ))}
          </div>

          <label className="block font-medium flex items-center gap-2">
            <FaStickyNote /> 기타 사항
          </label>
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="편하시게 세부사항이나 하고싶은 말씀 적어주시면 됩니다. 없으면 안 적으셔도 됩니다."
            className="w-full h-28 p-3 border rounded-md resize-none"
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-4 bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition"
        >
          🧾 등록 요청하기
        </button>
      </div>

      {/* 오른쪽: 카카오톡 채널 */}
      <div className="bg-yellow-50 p-6 rounded-2xl shadow-md flex flex-col items-center justify-center text-center border border-yellow-200">
        <FaComments className="text-4xl text-yellow-500 mb-4" />
        <h3 className="text-xl font-bold mb-2">모손 부동산 카카오톡 채널</h3>
        <p className="text-sm mb-4">
          빠르게 문의하고 싶다면, 톡으로 편하게 말씀해주세요!
        </p>
        <a
          href="https://pf.kakao.com/_UBuCn/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 px-4 rounded-full transition"
        >
          💬 카카오톡 채널로 이동
        </a>
      </div>
    </motion.div>
  );
};

export default SellProperty;
