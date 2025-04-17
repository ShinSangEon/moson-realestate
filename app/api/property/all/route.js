import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("매물 조회 시작...");

    const properties = await prisma.property.findMany({
      where: {
        isHidden: false,
      },
      include: {
        agent: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("조회된 매물 수:", properties.length);
    return NextResponse.json({ success: true, properties });
  } catch (error) {
    console.error("매물 조회 상세 오류:", error);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);

    return NextResponse.json(
      {
        success: false,
        message: "매물을 불러오는데 실패했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
