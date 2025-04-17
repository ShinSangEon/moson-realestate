import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dong = searchParams.get("dong");

    if (!dong) {
      return NextResponse.json(
        { error: "동 이름이 필요합니다." },
        { status: 400 }
      );
    }

    const apartments = await prisma.apartment_Details.findMany({
      where: {
        address: {
          contains: dong,
        },
      },
      include: {
        marker: true,
      },
    });

    if (!apartments || apartments.length === 0) {
      return NextResponse.json(
        { error: "해당 동에 아파트가 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(apartments);
  } catch (error) {
    console.error("동별 아파트 조회 오류:", error);
    return NextResponse.json(
      { error: "아파트 데이터를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
