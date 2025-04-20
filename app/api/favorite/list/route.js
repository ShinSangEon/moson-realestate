import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        apartment: true, // 🔥 아파트 상세정보 포함
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, favorites });
  } catch (error) {
    console.error("찜 목록 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "찜 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
