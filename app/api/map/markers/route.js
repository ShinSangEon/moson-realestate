import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 주소에서 행정동 추출 함수
const extractDongFromAddress = (address) => {
  if (!address) return "기타";

  // 주소에서 읍/면/동 추출
  const match = address.match(/([가-힣]+(동|읍|면))/);
  if (match) {
    return match[1];
  }

  // 읍/면/동이 없는 경우 (예: "경상남도 진주시" -> "진주시")
  const siMatch = address.match(/([가-힣]+시)/);
  if (siMatch) {
    return siMatch[1];
  }

  return "기타";
};

export async function GET() {
  try {
    // Prisma 연결 상태 확인
    try {
      await prisma.$connect();
      console.log("✅ Prisma 연결 성공");
    } catch (error) {
      console.error("❌ Prisma 연결 실패:", error);
      return NextResponse.json(
        { error: "데이터베이스 연결 실패" },
        { status: 500 }
      );
    }

    // 아파트 기본 정보와 상세 정보를 함께 가져옴
    const apartments = await prisma.apartmentBasicInfo.findMany({
      where: {
        lat: { not: null },
        lng: { not: null },
      },
      include: {
        detailedInfo: true,
        transactions: {
          orderBy: {
            dealDay: "desc",
          },
          take: 1,
        },
      },
    });

    // 마커 데이터 생성
    const markers = apartments.map((apt) => {
      // 주소에서 행정동 추출
      const dong = extractDongFromAddress(apt.kaptAddr);

      // 최근 거래 정보
      const lastTransaction = apt.transactions[0];

      return {
        kaptCode: apt.kaptCode,
        complexName: apt.kaptName,
        lat: apt.lat,
        lng: apt.lng,
        dong: dong,
        address: apt.kaptAddr,
        avgSale: lastTransaction?.dealAmount || null,
        rentRate: apt.detailedInfo?.rentRate || null,
        thumbnail: apt.detailedInfo?.thumbnail || null,
      };
    });

    return NextResponse.json(markers);
  } catch (error) {
    console.error("마커 데이터 가져오기 실패:", error);
    return NextResponse.json(
      { error: "마커 데이터를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("Prisma 연결 종료 실패:", error);
    }
  }
}
