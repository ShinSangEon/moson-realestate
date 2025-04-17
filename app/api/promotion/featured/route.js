import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const currentDate = new Date();

    const promotions = await prisma.promotionPost.findMany({
      where: {
        isFeatured: true,
        startDate: {
          lte: currentDate,
        },
        endDate: {
          gte: currentDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5, // 최대 5개만 표시
    });

    return NextResponse.json({
      success: true,
      promotions,
    });
  } catch (error) {
    console.error("홍보 게시물 불러오기 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "홍보 게시물을 불러오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
