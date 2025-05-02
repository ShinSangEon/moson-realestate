import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      const favorites = await prisma.favorite.findMany({
        where: { userId },
        include: {
          apartment: true, // 🔥 아파트 상세정보 포함
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ success: true, favorites });
    } catch (jwtError) {
      console.error("JWT 검증 오류:", jwtError);
      return NextResponse.json(
        { success: false, message: "인증 토큰이 유효하지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("찜 목록 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "찜 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
