import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("공인중개사 계정 생성 시작...");

    // 공인중개사 계정 생성
    const agent = await prisma.agent.create({
      data: {
        name: "김부동",
        email: "kim@realestate.com",
        phoneNumber: "010-1234-5678",
        officeName: "부동산중개법인",
        profileImage:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a",
      },
    });

    console.log("공인중개사 계정 생성 성공:", agent);
    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("공인중개사 계정 생성 오류:", error);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);

    return NextResponse.json(
      {
        success: false,
        message: "공인중개사 계정 생성에 실패했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
