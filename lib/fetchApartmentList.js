import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

async function fetchSidoApartmentList(sidoCode, pageNo = 1, numOfRows = 1000) {
  const url = "https://apis.data.go.kr/1613000/AptListService3/getSidoAptList3"; // ✅ 바뀐 API 주소

  const params = {
    serviceKey: process.env.MOLIT_INFO_API_KEY,
    sidoCode: "48", // 예: 48 → 경상남도
    pageNo,
    numOfRows,
    _type: "json",
  };

  console.log("📡 요청 파라미터:", params);

  try {
    const res = await axios.get(url, { params });

    console.log("📄 응답 상태:", res.status);
    console.log("📄 응답 데이터:", JSON.stringify(res.data, null, 2));

    return res.data?.response?.body?.items || [];
  } catch (err) {
    console.error("❌ 단지 목록 가져오기 실패:", err.message);
    if (err.response) {
      console.error("📡 응답 상태 코드:", err.response.status);
      console.error("📡 응답 내용:", err.response.data);
    }
    return [];
  }
}

export default fetchSidoApartmentList;
