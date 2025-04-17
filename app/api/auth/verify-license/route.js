import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { officeName, agentName } = await request.json();

    if (!officeName && !agentName) {
      return NextResponse.json(
        { error: "사무소명 또는 대표자명을 입력해주세요." },
        { status: 400 }
      );
    }

    const apiKey = process.env.VWORLD_API_KEY;

    // API 파라미터 구성
    let parameter = "";
    parameter += encodeURIComponent("key") + "=" + encodeURIComponent(apiKey);
    parameter +=
      "&" +
      encodeURIComponent("domain") +
      "=" +
      encodeURIComponent("localhost:3000");
    if (officeName)
      parameter +=
        "&" +
        encodeURIComponent("bsnmCmpnm") +
        "=" +
        encodeURIComponent(officeName);
    if (agentName)
      parameter +=
        "&" +
        encodeURIComponent("brkrNm") +
        "=" +
        encodeURIComponent(agentName);
    parameter +=
      "&" + encodeURIComponent("format") + "=" + encodeURIComponent("json");
    parameter +=
      "&" + encodeURIComponent("numOfRows") + "=" + encodeURIComponent("10");
    parameter +=
      "&" + encodeURIComponent("pageNo") + "=" + encodeURIComponent("1");

    const VWORLD_API_URL = "http://api.vworld.kr/ned/data/getEBOfficeInfo?";
    const apiUrl = VWORLD_API_URL + parameter;

    console.log("API 요청 URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("API 응답 오류:", response.status, response.statusText);
      throw new Error("공인중개사 정보 조회 중 오류가 발생했습니다.");
    }

    const data = await response.json();
    console.log("API 응답 데이터:", JSON.stringify(data, null, 2));

    // API 키 오류 처리
    if (data.EDOffices?.resultCode === "INCORRECT_KEY") {
      return NextResponse.json(
        { error: "API 인증키가 올바르지 않습니다. 관리자에게 문의해주세요." },
        { status: 500 }
      );
    }

    // 응답 데이터 파싱 수정
    const offices = data.EDOffices?.field || [];

    return NextResponse.json({
      isValid: offices.length > 0,
      offices: offices.map((office) => ({
        officeName: office.bsnmCmpnm,
        agentName: office.brkrNm,
        licenseNumber: office.jurirno,
        officeAddress: office.rdnmadr,
        status: office.sttusSeCodeNm,
        registrationDate: office.registDe,
      })),
    });
  } catch (error) {
    console.error("공인중개사 정보 조회 오류:", error);
    return NextResponse.json(
      { error: "공인중개사 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
