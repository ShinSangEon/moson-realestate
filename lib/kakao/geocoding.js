import axios from "axios";

export async function getCoordinatesFromAddress(address) {
  try {
    const response = await axios.get(
      "https://dapi.kakao.com/v2/local/search/address.json",
      {
        params: { query: address },
        headers: {
          Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
        },
      }
    );
    const { documents } = response.data;
    if (documents.length > 0) {
      return {
        lat: parseFloat(documents[0].y),
        lng: parseFloat(documents[0].x),
      };
    }
    return null;
  } catch (error) {
    console.error("주소 변환 중 오류 발생:", error.message);
    return null;
  }
}
