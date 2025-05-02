import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 주소에서 동 추출하는 함수
function extractDong(address) {
  // '진주시' 다음에 나오는 '읍', '면', '동'으로 끝나는 단어를 추출
  const match = address.match(/진주시\s+([^\s]+(동|읍|면))/);
  return match ? match[1] : null;
}

export async function GET() {
  try {
    const apartments = await prisma.apartment.findMany({
      select: {
        complexUniqueId: true,
        complexNameBuilding: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    // 주소에서 동을 추출하여 데이터에 추가
    const processedApartments = apartments.map((apt) => ({
      ...apt,
      dong: extractDong(apt.address),
    }));

    return NextResponse.json({ apartments: processedApartments });
  } catch (error) {
    console.error("아파트 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: "아파트 데이터를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
