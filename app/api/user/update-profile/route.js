import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function POST(req) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "인증되지 않았습니다." },
        { status: 401 }
      );
    }

    const { profileImage } = await req.json();

    if (!profileImage || typeof profileImage !== "string") {
      return NextResponse.json(
        { success: false, message: "올바른 이미지 주소가 아닙니다." },
        { status: 400 }
      );
    }

    // 유저 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage,
      },
    });

    return NextResponse.json({
      success: true,
      message: "프로필 사진이 저장되었습니다.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ 프로필 이미지 업데이트 실패:", error);
    return NextResponse.json(
      { success: false, message: "업데이트 실패" },
      { status: 500 }
    );
  }
}
