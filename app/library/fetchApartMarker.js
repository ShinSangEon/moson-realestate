import axios from "axios";

let cachedApartmentMarkers = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getApartmentMarkers() {
  try {
    if (
      cachedApartmentMarkers &&
      lastFetchTime &&
      Date.now() - lastFetchTime < CACHE_DURATION
    ) {
      console.log(
        "캐시된 아파트 마커 데이터 사용:",
        cachedApartmentMarkers.length
      );
      return cachedApartmentMarkers;
    }

    console.log("서버에서 아파트 마커 데이터 가져오는 중...");
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/apartmentMarker`
    );

    cachedApartmentMarkers = res.data;
    lastFetchTime = Date.now();
    console.log("아파트 마커 데이터 캐싱 완료:", cachedApartmentMarkers.length);

    return res.data;
  } catch (error) {
    console.error("아파트 마커 데이터 로딩 오류:", error);
    throw new Error("아파트 마커 데이터를 불러오지 못했습니다.");
  }
}

export async function createApartmentMarker(data) {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/apartmentMarker`,
      data,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    cachedApartmentMarkers = null;
    lastFetchTime = null;

    return res.data;
  } catch (error) {
    console.error("아파트 마커 추가 오류:", error);
    throw new Error("아파트 마커 데이터를 추가할 수 없습니다.");
  }
}
