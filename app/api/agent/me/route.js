import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function GET() {
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

  try {
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: {
        id: true,
        officeName: true,
        email: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message:
            "공인중개사 계정이 아닙니다. 공인중개사만 접근 가능한 페이지입니다.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("공인중개사 정보 조회 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 }
    );
  }
}
