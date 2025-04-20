import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getAuthUserId();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다. 로그인 페이지로 이동합니다.",
        },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("알림 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
