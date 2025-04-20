"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

// 한글 금액을 숫자로 변환하는 함수
const parseKoreanMoney = (str) => {
  let num = 0;
  const eokMatch = str.match(/(\d+)\s*억/);
  const chunMatch = str.match(/(\d+)\s*천/);
  if (eokMatch) num += parseInt(eokMatch[1]) * 100000000;
  if (chunMatch) num += parseInt(chunMatch[1]) * 10000000;
  return num || parseInt(str.replace(/[^0-9]/g, "")); // 숫자만 있으면 그것도
};

export default function NewProperty() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [status, setStatus] = useState("loading");

  const [formData, setFormData] = useState({
    title: "",
    address: "",
    dong: "",
    complexName: "",
    type: "매매",
    price: "",
    priceDisplay: "",
    area: "",
    pyung: "",
    floor: "",
    totalFloors: "",
    rooms: "",
    bathrooms: "",
    maintenanceFee: "",

    monthlyFee: "",
    monthlyDisplay: "",
    deposit: "",
    depositDisplay: "",
    direction: "남향",
    description: "",
    images: "",
    isVerified: "true",
  });

  useEffect(() => {
    const fetchAgentId = async () => {
      try {
        const res = await fetch("/api/agent/me", {
          credentials: "include",
        });
        const data = await res.json();

        if (res.status === 401) {
          if (status !== "unauthorized") {
            setStatus("unauthorized");
            toast.error("로그인이 필요합니다.");

            setTimeout(() => {
              router.push(
                `/login?error=${encodeURIComponent(
                  "로그인이 필요합니다."
                )}&from=/admin/property/new`
              );
            }, 100);
          }
          return;
        }

        if (res.status === 403 && status !== "not-agent") {
          toast.error("공인중개사 계정만 접근 가능합니다.");
          setStatus("not-agent");

          setTimeout(() => {
            router.replace(
              `/login?error=${encodeURIComponent(
                "공인중개사만 접근 가능합니다."
              )}&from=/admin/property/new`
            );
          }, 1000);
          return;
        }

        if (res.ok && data.success) {
          setAgentId(data.agent.id);
          setStatus("success");
          return;
        }

        setStatus("unauthorized");
        toast.error(data.message || "알 수 없는 오류");
        router.replace("/login");
      } catch (error) {
        console.error("공인중개사 ID 가져오기 실패:", error);
        setStatus("unauthorized");
        toast.error("서버 오류입니다.");
        router.replace("/login");
      }
    };

    fetchAgentId();
  }, [router, status]);

  if (status === "loading")
    return <p className="text-center mt-20">확인 중입니다...</p>;

  if (status === "not-agent") {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">접근 불가</h2>
        <p>이 페이지는 공인중개사 계정만 접근할 수 있습니다.</p>
        <Link href="/" className="mt-4 inline-block text-green-600 underline">
          홈으로 가기
        </Link>
      </div>
    );
  }

  if (status === "unauthorized") return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "price") {
      setFormData((prev) => ({
        ...prev,
        priceDisplay: value,
        price: parseKoreanMoney(value),
      }));
    } else if (name === "maintenanceFee") {
      setFormData((prev) => ({
        ...prev,
        maintenanceFee: value,
      }));
    } else if (name === "monthlyFee") {
      setFormData((prev) => ({
        ...prev,
        monthlyDisplay: value,
        monthlyFee: parseKoreanMoney(value),
      }));
    } else if (name === "deposit") {
      setFormData((prev) => ({
        ...prev,
        depositDisplay: value,
        deposit: parseKoreanMoney(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 가격 유효성 검증
      if (isNaN(formData.price)) {
        toast.error("가격을 숫자로 정확히 입력해주세요.");
        setLoading(false);
        return;
      }

      // 월세일 경우 월세와 보증금 유효성 검증
      if (formData.type === "월세") {
        if (isNaN(formData.monthlyFee)) {
          toast.error("월세를 숫자로 정확히 입력해주세요.");
          setLoading(false);
          return;
        }
        if (isNaN(formData.deposit)) {
          toast.error("보증금을 숫자로 정확히 입력해주세요.");
          setLoading(false);
          return;
        }
      }

      // 전세일 경우 전세금 유효성 검증
      if (formData.type === "전세" && isNaN(formData.deposit)) {
        toast.error("전세금을 숫자로 정확히 입력해주세요.");
        setLoading(false);
        return;
      }

      // 이미지 URL을 배열로 변환
      const images = formData.images
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url);

      const response = await fetch("/api/property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ 요거 추가!
        body: JSON.stringify({
          ...formData,
          images,
          agentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("매물이 등록되었습니다.");
        router.push("/admin/property");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("매물 등록 실패:", error);
      toast.error(error.message || "매물 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md animate-fade-in">
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">
        📋 새 매물 등록
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            기본 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매물 제목
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="예: 역삼동 풀옵션 신축 아파트"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="예: 서울시 강남구 역삼동 123-45"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                동
              </label>
              <input
                type="text"
                name="dong"
                value={formData.dong}
                onChange={handleChange}
                required
                placeholder="예: 101동"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                단지명
              </label>
              <input
                type="text"
                name="complexName"
                value={formData.complexName}
                onChange={handleChange}
                required
                placeholder="예: 역삼자이아파트"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                매물 유형
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="매매">매매</option>
                <option value="전세">전세</option>
                <option value="월세">월세</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                가격
              </label>
              <input
                type="text"
                name="price"
                value={formData.priceDisplay}
                onChange={handleChange}
                required
                placeholder="예: 3억2천"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            상세 정보
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                면적 (m²)
              </label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                placeholder="예: 84.9"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                평수
              </label>
              <input
                type="number"
                name="pyung"
                value={formData.pyung}
                onChange={handleChange}
                required
                placeholder="예: 25.7"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                층수
              </label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                required
                placeholder="예: 15"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                총 층수
              </label>
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                required
                placeholder="예: 25"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                방 개수
              </label>
              <input
                type="number"
                name="rooms"
                value={formData.rooms}
                onChange={handleChange}
                required
                placeholder="예: 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                화장실 개수
              </label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                required
                placeholder="예: 2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                관리비
              </label>
              <input
                type="text"
                name="maintenanceFee"
                value={formData.maintenanceFee}
                onChange={handleChange}
                placeholder="예: 15만원"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                방향
              </label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="남향">남향</option>
                <option value="북향">북향</option>
                <option value="동향">동향</option>
                <option value="서향">서향</option>
                <option value="남동향">남동향</option>
                <option value="남서향">남서향</option>
                <option value="북동향">북동향</option>
                <option value="북서향">북서향</option>
              </select>
            </div>
          </div>
        </div>

        {/* 월세/전세 정보 */}
        {(formData.type === "월세" || formData.type === "전세") && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {formData.type === "월세" ? "월세 정보" : "전세 정보"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.type === "월세" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    월세
                  </label>
                  <input
                    type="text"
                    name="monthlyFee"
                    value={formData.monthlyDisplay}
                    onChange={handleChange}
                    required
                    placeholder="예: 50만원"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === "월세" ? "보증금" : "전세금"}
                </label>
                <input
                  type="text"
                  name="deposit"
                  value={formData.depositDisplay}
                  onChange={handleChange}
                  required
                  placeholder="예: 1억"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            추가 정보
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="매물의 특징과 장점을 자세히 설명해주세요."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이미지 URL
              </label>
              <textarea
                name="images"
                value={formData.images}
                onChange={handleChange}
                required
                rows={2}
                placeholder="이미지 URL을 쉼표(,)로 구분하여 입력해주세요."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                실매물 여부
              </label>
              <select
                name="isVerified"
                value={formData.isVerified}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="true">실매물</option>
                <option value="false">일반 매물</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 shadow-lg transition-colors duration-200"
          >
            {loading ? "⏳ 등록 중..." : "✅ 매물 등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
