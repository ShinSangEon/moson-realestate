"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaPhone,
  FaHome,
  FaMoneyCheckAlt,
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaStickyNote,
  FaComments,
  FaExchangeAlt,
} from "react-icons/fa";
import Swal from "sweetalert2";

const FindProperty = () => {
  const [isLease, setIsLease] = useState(false);
  const [leaseTerm, setLeaseTerm] = useState("");
  const [showTypeEtc, setShowTypeEtc] = useState(false);
  const [showMoveInEtc, setShowMoveInEtc] = useState(false);

  const [phone, setPhone] = useState("");
  const [types, setTypes] = useState([]);
  const [typeEtc, setTypeEtc] = useState("");
  const [dealType, setDealType] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [moveIn, setMoveIn] = useState([]);
  const [moveInEtc, setMoveInEtc] = useState("");
  const [note, setNote] = useState("");

  const toggleType = (value) => {
    setTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleMoveIn = (value) => {
    setMoveIn((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!phone.startsWith("010")) {
      Swal.fire({
        icon: "warning",
        title: "전화번호 오류",
        text: "전화번호는 반드시 010으로 시작해야 합니다.",
      });
      return;
    }
    const payload = {
      phone,
      types: [...types, showTypeEtc && typeEtc ? `기타:${typeEtc}` : null]
        .filter(Boolean)
        .join(","),
      dealType,
      leaseTerm: dealType === "임차" ? leaseTerm : null,
      budget,
      location,
      moveIn: [
        ...moveIn,
        showMoveInEtc && moveInEtc ? `기타:${moveInEtc}` : null,
      ]
        .filter(Boolean)
        .join(","),
      note,
    };

    try {
      const res = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "요청 완료!",
          text: "정상적으로 요청이 접수되었습니다.",
        });
        // 초기화
        setPhone("");
        setTypes([]);
        setTypeEtc("");
        setDealType("");
        setLeaseTerm("");
        setBudget("");
        setLocation("");
        setMoveIn([]);
        setMoveInEtc("");
        setNote("");
      } else {
        throw new Error("저장 실패");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "요청 실패",
        text: "문제가 발생했습니다. 다시 시도해주세요.",
      });
    }
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 p-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 왼쪽: 구해줘 폼 */}
      <div className="bg-white p-6 rounded-2xl shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-center">
          📞 구해줘! 원하는 매물 찾기
        </h2>

        <div className="space-y-4">
          <label className="block font-medium flex items-center gap-2">
            <FaPhone /> 전화번호
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="w-full px-4 py-2 border rounded-md"
          />

          <label className="block font-medium flex items-center gap-2">
            <FaHome /> 종류
          </label>
          <div className="flex flex-wrap gap-3">
            {["원룸류", "아파트", "상가", "토지"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                {type}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showTypeEtc}
                onChange={(e) => setShowTypeEtc(e.target.checked)}
              />
              기타
            </label>
          </div>
          {showTypeEtc && (
            <input
              type="text"
              value={typeEtc}
              onChange={(e) => setTypeEtc(e.target.value)}
              placeholder="기타: 원하는 매물 종류 입력"
              className="w-full mt-2 px-3 py-2 border rounded-md"
            />
          )}

          <label className="block font-medium flex items-center gap-2">
            <FaExchangeAlt /> 거래 형태
          </label>
          <div className="flex gap-6">
            {["매매", "임차"].map((type) => (
              <label key={type} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dealType"
                  checked={dealType === type}
                  onChange={() => setDealType(type)}
                />
                {type}
              </label>
            ))}
          </div>

          {dealType === "임차" && (
            <div>
              <label className="block font-medium mt-2">임차 기간</label>
              <div className="flex gap-4">
                {["1년", "2년", "기타"].map((term) => (
                  <label key={term} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="leaseTerm"
                      checked={leaseTerm === term}
                      value={term}
                      onChange={(e) => setLeaseTerm(e.target.value)}
                    />
                    {term}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="block font-medium flex items-center gap-2">
            <FaMoneyCheckAlt /> 예산 (만원)
          </label>
          <input
            type="text" // ← number → text
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="예: 1억~1억2천"
            className="w-full px-4 py-2 border rounded-md"
          />

          <label className="block font-medium flex items-center gap-2">
            <FaMapMarkedAlt /> 원하는 위치
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 상평동 / 상관없음 등"
            className="w-full px-4 py-2 border rounded-md"
          />

          <label className="block font-medium flex items-center gap-2">
            <FaCalendarAlt /> 입주 시기
          </label>
          <div className="flex flex-wrap gap-4">
            {["1주 이내", "2주 이내", "3주 이내"].map((time) => (
              <label key={time} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={moveIn.includes(time)}
                  onChange={() => toggleMoveIn(time)}
                />
                {time}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMoveInEtc}
                onChange={(e) => setShowMoveInEtc(e.target.checked)}
              />
              기타
            </label>
          </div>
          {showMoveInEtc && (
            <input
              type="text"
              value={moveInEtc}
              onChange={(e) => setMoveInEtc(e.target.value)}
              placeholder="기타: 희망 입주일 입력"
              className="w-full mt-2 px-3 py-2 border rounded-md"
            />
          )}

          <label className="block font-medium flex items-center gap-2">
            <FaStickyNote /> 기타 사항
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="세부사항이나 하고싶은 말씀을 편하게 남겨주세요."
            className="w-full h-28 p-3 border rounded-md resize-none"
          ></textarea>
        </div>

        <button
          className="w-full mt-4 bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 transition"
          onClick={handleSubmit}
        >
          🧾 요청하기
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

export default FindProperty;
