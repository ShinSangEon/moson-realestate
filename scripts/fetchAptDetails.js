import { saveAptDetailToDB } from "../lib/api/apt.js";
import prisma from "../lib/prisma.js";

async function fetchAllAptDetails() {
  try {
    // 모든 아파트의 kaptCode 가져오기
    const apartments = await prisma.apartmentBasicInfo.findMany({
      select: { kaptCode: true },
    });

    console.log(`총 ${apartments.length}개의 아파트 정보를 가져옵니다.`);

    // 각 아파트의 상세 정보를 가져와서 저장
    for (const apt of apartments) {
      try {
        console.log(`아파트 코드 ${apt.kaptCode}의 상세 정보를 가져오는 중...`);
        await saveAptDetailToDB(apt.kaptCode);
        console.log(`아파트 코드 ${apt.kaptCode}의 상세 정보 저장 완료`);
      } catch (error) {
        console.error(`아파트 코드 ${apt.kaptCode} 처리 중 오류 발생:`, error);
      }
    }

    console.log("모든 아파트 상세 정보 가져오기 완료");
  } catch (error) {
    console.error("아파트 상세 정보 가져오기 실패:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// 명령줄 인수 확인
const args = process.argv.slice(2);
if (args.includes("--all")) {
  fetchAllAptDetails();
} else {
  console.log("사용법: node scripts/fetchAptDetails.js --all");
}
