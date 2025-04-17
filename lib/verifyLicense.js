export async function verifyLicenseFromAPI(officeName, agentName) {
  try {
    const apiKey = process.env.VWORLD_API_KEY;
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

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("공인중개사 정보 조회 중 오류가 발생했습니다.");
    }

    const data = await response.json();
    const offices = data.EDOffices?.field || [];

    return offices.map((office) => ({
      officeName: office.bsnmCmpnm,
      agentName: office.brkrNm,
      licenseNumber: office.jurirno,
      officeAddress: office.rdnmadr,
      status: office.sttusSeCodeNm,
      registrationDate: office.registDe,
    }));
  } catch (error) {
    console.error("자격증 검증 오류:", error);
    throw error;
  }
}
