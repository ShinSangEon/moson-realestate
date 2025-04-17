import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const apartments = await prisma.apartment_Details.findMany({
      select: {
        address: true,
      },
    });

    // 주소에서 동 정보 추출
    const dongs = apartments
      .map((apt) => {
        const match = apt.address.match(/([가-힣]+동)/);
        return match ? match[1] : null;
      })
      .filter((dong) => dong !== null)
      .sort();

    // 중복 제거
    const uniqueDongs = [...new Set(dongs)];

    return NextResponse.json(uniqueDongs);
  } catch (error) {
    console.error("동 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "동 목록을 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
