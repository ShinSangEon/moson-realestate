import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  const userId = getAuthUserId(); // ❌ await 쓰면 안돼!

  if (!userId) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        apartment: true, // 🔥 아파트 상세정보 포함
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error("찜 목록 조회 실패:", err);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
