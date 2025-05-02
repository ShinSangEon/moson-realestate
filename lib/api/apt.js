import prisma from "../prisma.js";

/**
 * 아파트 상세 정보를 가져오는 함수
 * @param {string} kaptCode - 아파트 코드
 * @returns {Promise<Object>} 아파트 상세 정보
 */
export async function getAptDetail(kaptCode) {
  try {
    // 1. 데이터베이스에서 아파트 기본 정보 조회
    const apartment = await prisma.apartmentBasicInfo.findUnique({
      where: { kaptCode },
      include: {
        detailedInfo: true,
        transactions: {
          orderBy: [
            { dealYear: "desc" },
            { dealMonth: "desc" },
            { dealDay: "desc" },
          ],
          take: 10,
        },
      },
    });

    if (!apartment) {
      return {
        success: false,
        message: `아파트 정보를 찾을 수 없습니다. (kaptCode: ${kaptCode})`,
      };
    }

    // 2. 상세 정보가 없으면 국토교통부 API에서 가져와서 저장
    if (!apartment.detailedInfo) {
      try {
        const detailedInfo = await saveAptDetailToDB(kaptCode);
        console.log(`✅ 상세 정보 저장 완료: ${kaptCode}`);

        // 저장 후 다시 조회
        const updatedApartment = await prisma.apartmentBasicInfo.findUnique({
          where: { kaptCode },
          include: {
            detailedInfo: true,
            transactions: {
              orderBy: [
                { dealYear: "desc" },
                { dealMonth: "desc" },
                { dealDay: "desc" },
              ],
              take: 10,
            },
          },
        });
        return { success: true, data: updatedApartment };
      } catch (error) {
        console.error("상세 정보 저장 실패:", error);
        // 상세 정보 저장 실패 시 기본 정보만 반환
        return { success: true, data: apartment };
      }
    }

    // 3. 평균 가격 계산
    const saleTransactions = apartment.transactions.filter(
      (t) => t.dealType === "매매"
    );
    const rentTransactions = apartment.transactions.filter(
      (t) => t.dealType === "전세"
    );

    const avgSale = saleTransactions.length
      ? Math.round(
          saleTransactions.reduce((sum, t) => sum + t.saleAmount, 0) /
            saleTransactions.length
        )
      : 0;

    const avgRent = rentTransactions.length
      ? Math.round(
          rentTransactions.reduce((sum, t) => sum + t.depositAmount, 0) /
            rentTransactions.length
        )
      : 0;

    const rentRate = avgSale ? Math.round((avgRent / avgSale) * 100) : 0;

    return {
      success: true,
      data: {
        basicInfo: {
          kaptCode: apartment.kaptCode,
          kaptName: apartment.kaptName,
          doroJuso: apartment.doroJuso,
          hoCnt: apartment.hoCnt,
          kaptDongCnt: apartment.kaptDongCnt,
          codeHeatNm: apartment.codeHeatNm,
          codeAptNm: apartment.codeAptNm,
          kaptAddr: apartment.kaptAddr,
          lat: apartment.lat,
          lng: apartment.lng,
        },
        detailedInfo: apartment.detailedInfo || {},
        transactions: apartment.transactions.map((t) => ({
          dealType: t.dealType,
          saleAmount: t.saleAmount,
          depositAmount: t.depositAmount,
          monthlyAmount: t.monthlyAmount,
          area: t.area,
          dealYear: t.dealYear,
          dealMonth: t.dealMonth,
          dealDay: t.dealDay,
          floor: t.floor,
          aptNm: t.aptNm,
          jibun: t.jibun,
          buildYear: t.buildYear,
        })),
        avgSale,
        avgRent,
        rentRate,
      },
    };
  } catch (error) {
    console.error("아파트 정보 조회 실패:", error);
    return {
      success: false,
      message: error.message || "서버 오류가 발생했습니다.",
    };
  }
}

/**
 * 아파트 목록을 가져오는 함수
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Object>} 아파트 목록
 */
export async function getAptList(params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`/api/apt?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("아파트 목록을 불러오는데 실패했습니다.");
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "알 수 없는 오류가 발생했습니다.");
    }
    return data.data;
  } catch (error) {
    console.error("아파트 목록 조회 실패:", error);
    throw error;
  }
}

/**
 * 아파트 거래 내역을 가져오는 함수
 * @param {string} kaptCode - 아파트 코드
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Object>} 거래 내역
 */
export async function getAptTransactions(kaptCode, params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(
      `/api/apt/${kaptCode}/transactions?${queryParams.toString()}`
    );
    if (!response.ok) {
      throw new Error("거래 내역을 불러오는데 실패했습니다.");
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "알 수 없는 오류가 발생했습니다.");
    }
    return data.data;
  } catch (error) {
    console.error("거래 내역 조회 실패:", error);
    throw error;
  }
}

/**
 * 아파트 매물 목록을 가져오는 함수
 * @param {string} kaptCode - 아파트 코드
 * @param {Object} params - 검색 파라미터
 * @returns {Promise<Object>} 매물 목록
 */
export async function getAptProperties(kaptCode, params = {}) {
  try {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(
      `/api/apt/${kaptCode}/properties?${queryParams.toString()}`
    );
    if (!response.ok) {
      throw new Error("매물 목록을 불러오는데 실패했습니다.");
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || "알 수 없는 오류가 발생했습니다.");
    }
    return data.data;
  } catch (error) {
    console.error("매물 목록 조회 실패:", error);
    throw error;
  }
}

/**
 * 국토교통부 API에서 아파트 상세 정보를 가져옵니다.
 * @param {string} kaptCode - 아파트 코드
 * @returns {Promise<Object>} - 아파트 상세 정보
 */
export async function getAptDetailFromGov(kaptCode) {
  const apiKey = encodeURIComponent(process.env.NEXT_PUBLIC_GOV_API_KEY);
  const url = `https://apis.data.go.kr/1613000/AptBasisInfoServiceV3/getAphusDtlInfoV3?serviceKey=${apiKey}&kaptCode=${kaptCode}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // XML 응답을 텍스트로 받아서 처리
      const text = await response.text();
      if (text.includes("<OpenAPI_ServiceResponse>")) {
        throw new Error("API 서비스 오류: " + text);
      }
      // JSON으로 변환 시도
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("API 응답을 JSON으로 변환할 수 없습니다: " + text);
      }
    }

    if (!data.response || !data.response.body || !data.response.body.item) {
      throw new Error("API 응답 형식이 올바르지 않습니다.");
    }

    const aptInfo = data.response.body.item;
    return {
      kaptCode: aptInfo.kaptCode,
      kaptName: aptInfo.kaptName,
      codeMgr: aptInfo.codeMgr,
      kaptMgrCnt: parseInt(aptInfo.kaptMgrCnt) || 0,
      kaptCcompany: aptInfo.kaptCcompany,
      codeSec: aptInfo.codeSec,
      kaptdScnt: parseInt(aptInfo.kaptdScnt) || 0,
      kaptdSecCom: aptInfo.kaptdSecCom,
      codeClean: aptInfo.codeClean,
      kaptdClcnt: parseInt(aptInfo.kaptdClcnt) || 0,
      codeGarbage: aptInfo.codeGarbage,
      codeDisinf: aptInfo.codeDisinf,
      kaptdDcnt: parseInt(aptInfo.kaptdDcnt) || 0,
      disposalType: aptInfo.disposalType,
      codeStr: aptInfo.codeStr,
      kaptdEcapa: parseInt(aptInfo.kaptdEcapa) || 0,
      codeEcon: aptInfo.codeEcon,
      codeEmgr: aptInfo.codeEmgr,
      codeFalarm: aptInfo.codeFalarm,
      codeWsupply: aptInfo.codeWsupply,
      codeElev: aptInfo.codeElev,
      kaptdEcnt: parseInt(aptInfo.kaptdEcnt) || 0,
      kaptdPcnt: parseInt(aptInfo.kaptdPcnt) || 0,
      kaptdPcntu: parseInt(aptInfo.kaptdPcntu) || 0,
      codeNet: aptInfo.codeNet,
      kaptdCccnt: parseInt(aptInfo.kaptdCccnt) || 0,
      welfareFacility: aptInfo.welfareFacility || "",
      kaptdWtimebus: aptInfo.kaptdWtimebus || "",
      subwayLine: aptInfo.subwayLine || "",
      subwayStation: aptInfo.subwayStation || "",
      kaptdWtimesub: aptInfo.kaptdWtimesub || "",
      convenientFacility: aptInfo.convenientFacility || "",
      educationFacility: aptInfo.educationFacility || "",
      groundElChargerCnt: parseInt(aptInfo.groundElChargerCnt) || 0,
      undergroundElChargerCnt: parseInt(aptInfo.undergroundElChargerCnt) || 0,
    };
  } catch (error) {
    console.error("아파트 상세 정보 조회 실패:", error);
    throw error;
  }
}

/**
 * 아파트 상세 정보를 DB에 저장합니다.
 * @param {string} kaptCode - 아파트 코드
 */
export async function saveAptDetailToDB(kaptCode) {
  try {
    // 1. 국토교통부 API에서 데이터 가져오기
    const aptDetail = await getAptDetailFromGov(kaptCode);

    // 2. DB에 저장
    await prisma.apartmentDetailedInfo.upsert({
      where: { kaptCode },
      update: {
        kaptName: aptDetail.kaptName,
        codeMgr: aptDetail.codeMgr,
        kaptMgrCnt: aptDetail.kaptMgrCnt,
        kaptCcompany: aptDetail.kaptCcompany,
        codeSec: aptDetail.codeSec,
        kaptdScnt: aptDetail.kaptdScnt,
        kaptdSecCom: aptDetail.kaptdSecCom,
        codeClean: aptDetail.codeClean,
        kaptdClcnt: aptDetail.kaptdClcnt,
        codeGarbage: aptDetail.codeGarbage,
        codeDisinf: aptDetail.codeDisinf,
        kaptdDcnt: aptDetail.kaptdDcnt,
        disposalType: aptDetail.disposalType,
        codeStr: aptDetail.codeStr,
        kaptdEcapa: aptDetail.kaptdEcapa,
        codeEcon: aptDetail.codeEcon,
        codeEmgr: aptDetail.codeEmgr,
        codeFalarm: aptDetail.codeFalarm,
        codeWsupply: aptDetail.codeWsupply,
        codeElev: aptDetail.codeElev,
        kaptdEcnt: aptDetail.kaptdEcnt,
        kaptdPcnt: aptDetail.kaptdPcnt,
        kaptdPcntu: aptDetail.kaptdPcntu,
        codeNet: aptDetail.codeNet,
        kaptdCccnt: aptDetail.kaptdCccnt,
        welfareFacility: aptDetail.welfareFacility,
        kaptdWtimebus: aptDetail.kaptdWtimebus,
        subwayLine: aptDetail.subwayLine,
        subwayStation: aptDetail.subwayStation,
        kaptdWtimesub: aptDetail.kaptdWtimesub,
        convenientFacility: aptDetail.convenientFacility,
        educationFacility: aptDetail.educationFacility,
        groundElChargerCnt: aptDetail.groundElChargerCnt,
        undergroundElChargerCnt: aptDetail.undergroundElChargerCnt,
      },
      create: {
        kaptCode,
        kaptName: aptDetail.kaptName,
        codeMgr: aptDetail.codeMgr,
        kaptMgrCnt: aptDetail.kaptMgrCnt,
        kaptCcompany: aptDetail.kaptCcompany,
        codeSec: aptDetail.codeSec,
        kaptdScnt: aptDetail.kaptdScnt,
        kaptdSecCom: aptDetail.kaptdSecCom,
        codeClean: aptDetail.codeClean,
        kaptdClcnt: aptDetail.kaptdClcnt,
        codeGarbage: aptDetail.codeGarbage,
        codeDisinf: aptDetail.codeDisinf,
        kaptdDcnt: aptDetail.kaptdDcnt,
        disposalType: aptDetail.disposalType,
        codeStr: aptDetail.codeStr,
        kaptdEcapa: aptDetail.kaptdEcapa,
        codeEcon: aptDetail.codeEcon,
        codeEmgr: aptDetail.codeEmgr,
        codeFalarm: aptDetail.codeFalarm,
        codeWsupply: aptDetail.codeWsupply,
        codeElev: aptDetail.codeElev,
        kaptdEcnt: aptDetail.kaptdEcnt,
        kaptdPcnt: aptDetail.kaptdPcnt,
        kaptdPcntu: aptDetail.kaptdPcntu,
        codeNet: aptDetail.codeNet,
        kaptdCccnt: aptDetail.kaptdCccnt,
        welfareFacility: aptDetail.welfareFacility,
        kaptdWtimebus: aptDetail.kaptdWtimebus,
        subwayLine: aptDetail.subwayLine,
        subwayStation: aptDetail.subwayStation,
        kaptdWtimesub: aptDetail.kaptdWtimesub,
        convenientFacility: aptDetail.convenientFacility,
        educationFacility: aptDetail.educationFacility,
        groundElChargerCnt: aptDetail.groundElChargerCnt,
        undergroundElChargerCnt: aptDetail.undergroundElChargerCnt,
      },
    });

    console.log(`아파트 상세 정보 저장 완료: ${kaptCode}`);
  } catch (error) {
    console.error("아파트 상세 정보 저장 실패:", error);
    throw error;
  }
}
