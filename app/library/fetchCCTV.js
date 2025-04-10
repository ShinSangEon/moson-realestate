import axios from "axios";

let cachedCCTVs = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getCCTVs() {
  try {
    if (
      cachedCCTVs &&
      lastFetchTime &&
      Date.now() - lastFetchTime < CACHE_DURATION
    ) {
      console.log("캐시된 CCTV 데이터 사용:", cachedCCTVs.length);
      return cachedCCTVs;
    }

    console.log("서버에서 CCTV 데이터 가져오는 중...");
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/cctv`);

    cachedCCTVs = res.data;
    lastFetchTime = Date.now();
    console.log("CCTV 데이터 캐싱 완료:", cachedCCTVs.length);

    return res.data;
  } catch (error) {
    console.error("CCTV 데이터 로딩 오류:", error);
    throw new Error("CCTV 데이터를 불러오지 못했습니다.");
  }
}

export async function createCCTV(data) {
  try {
    const res = await axios.post(`${API_URL}/api/cctv`, data, {
      headers: { "Content-Type": "application/json" },
    });

    cachedCCTVs = null;
    lastFetchTime = null;

    return res.data;
  } catch (error) {
    throw new Error("CCTV 데이터를 추가할 수 없습니다.");
  }
}
