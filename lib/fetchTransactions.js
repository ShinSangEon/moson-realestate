import axios from "axios";
import { parseStringPromise } from "xml2js";

function parseTransactionItem(item, LAWD_CD) {
  return {
    dealAmount: parseInt(item.거래금액?.[0].replace(/,/g, "") || "0", 10),
    area: parseFloat(item.전용면적?.[0] || "0"),
    dealYear: parseInt(item.년?.[0] || "0", 10),
    dealMonth: parseInt(item.월?.[0] || "0", 10),
    dealDay: parseInt(item.일?.[0] || "0", 10),
    floor: parseInt(item.층?.[0] || "0", 10),
    aptNm: item.아파트?.[0] || null,
    jibun: item.지번?.[0] || null,
    buildYear: parseInt(item.건축년도?.[0] || "0", 10),
    sggCd: LAWD_CD,
    aptSeq: item.아파트일련번호?.[0] || null,
    cdealType: item.거래유형?.[0] || null,
    cdealDay: item.계약일?.[0] || null,
    dealingGbn: item.거래구분?.[0] || null,
    estateAgentSggNm: item.중개사시군구명?.[0] || null,
    rgstDate: item.등기일자?.[0] || null,
    aptDong: item.아파트동?.[0] || null,
    slerGbn: item.매도자구분?.[0] || null,
    buyerGbn: item.매수자구분?.[0] || null,
    landLeaseholdGbn: item.토지임대구분?.[0] || null,
  };
}

export async function fetchTransactions({
  LAWD_CD,
  DEAL_YMD,
  pageNo = 1,
  numOfRows = 1000,
  serviceKey,
}) {
  const url =
    "http://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev";

  try {
    console.log("🔍 API 요청 시작...");
    console.log(`📅 조회 기간: ${DEAL_YMD}`);
    console.log(`📍 지역 코드: ${LAWD_CD}`);
    console.log(`📑 페이지: ${pageNo}, 건수: ${numOfRows}`);

    const res = await axios.get(url, {
      params: {
        LAWD_CD,
        DEAL_YMD,
        serviceKey,
        pageNo,
        numOfRows,
        _type: "xml",
      },
    });

    console.log("📄 응답 원본:", res.data);

    const result = await parseStringPromise(res.data);
    console.log("📦 파싱 결과:", result);

    // 응답 구조 디버깅
    console.log("🔍 응답 구조 확인:");
    console.log("1. response:", result.response);
    console.log("2. body:", result.response?.body);
    console.log("3. items:", result.response?.body?.[0]?.items);
    console.log("4. item:", result.response?.body?.[0]?.items?.[0]?.item);

    // 실제 아이템 데이터 확인
    console.log(
      "✅ 실제 아이템 데이터 확인:",
      JSON.stringify(result.response?.body?.[0]?.items?.[0]?.item, null, 2)
    );

    const items = result.response?.body?.[0]?.items?.[0]?.item || [];
    console.log(`📊 ${items.length}건의 원본 데이터 수집 완료`);

    // 긴급 점검 코드 추가
    console.log("🧾 원본 아이템 샘플:", items[0]);

    // 전체 키 확인 코드
    items.slice(0, 3).forEach((item, i) => {
      console.log(`📦 [${i + 1}]번 아이템 전체 키 목록:`);
      console.log(Object.keys(item));
    });

    // 유효한 거래 데이터만 필터링
    const validItems = items.filter((item) => {
      const isValid =
        item.아파트?.[0] &&
        item.지번?.[0] &&
        parseInt(item.거래금액?.[0].replace(/,/g, "") || "0", 10) > 0 &&
        parseFloat(item.전용면적?.[0] || "0") > 0 &&
        parseInt(item.년?.[0] || "0", 10) > 0 &&
        parseInt(item.월?.[0] || "0", 10) > 0 &&
        parseInt(item.일?.[0] || "0", 10) > 0;

      if (!isValid) {
        console.warn("⚠️ 유효하지 않은 거래 데이터 필터링됨:", {
          aptNm: item.아파트?.[0],
          jibun: item.지번?.[0],
          dealAmount: item.거래금액?.[0],
          area: item.전용면적?.[0],
          dealYear: item.년?.[0],
          dealMonth: item.월?.[0],
          dealDay: item.일?.[0],
        });
      }

      return isValid;
    });

    console.log(`📊 ${validItems.length}건의 유효한 데이터 필터링 완료`);

    const transactions = validItems.map((item) =>
      parseTransactionItem(item, LAWD_CD)
    );
    console.log(`✅ ${transactions.length}건의 거래 데이터 변환 완료`);
    return transactions;
  } catch (error) {
    console.error("❌ API 호출 실패:", error.message);
    if (error.response) {
      console.error("📡 API 응답 상태:", error.response.status);
      console.error("📡 API 응답 데이터:", error.response.data);
    }
    return [];
  }
}
