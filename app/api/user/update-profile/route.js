import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function PUT(request) {
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

      const body = await request.json();
      const { nickname, phoneNumber, profileImage } = body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          nickname,
          phoneNumber,
          profileImage,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
          profileImage: true,
          nickname: true,
        },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    } catch (jwtError) {
      console.error("JWT 검증 오류:", jwtError);
      return NextResponse.json(
        { success: false, message: "인증 토큰이 유효하지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("프로필 업데이트 실패:", error);
    return NextResponse.json(
      { success: false, message: "프로필 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}
