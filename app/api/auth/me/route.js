// /app/api/auth/me/route.js
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
      const userId = parseInt(decoded.userId);

      if (isNaN(userId)) {
        return NextResponse.json(
          { success: false, message: "잘못된 사용자 ID입니다." },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
          profileImage: true,
          nickname: true,
          rank: true,
          agent: {
            select: {
              officeName: true,
              licenseNumber: true,
              officeAddress: true,
            },
          },
          badges: {
            select: {
              id: true,
              badgeId: true,
              name: true,
              description: true,
              imageUrl: true,
            },
          },
          points: {
            select: {
              amount: true,
              reason: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "사용자를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 사용자의 좋아요, 채택 정보 조회
      const [likes, acceptedAnswers] = await Promise.all([
        prisma.like.count({
          where: { userId },
        }),
        prisma.comment.count({
          where: {
            authorId: userId,
            isAccepted: true,
          },
        }),
      ]);

      // 총 포인트 계산
      const totalPoints = user.points.reduce(
        (sum, point) => sum + point.amount,
        0
      );

      return NextResponse.json(
        {
          success: true,
          user: {
            ...user,
            points: totalPoints,
            likes: likes,
            acceptedAnswers: acceptedAnswers,
          },
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    } catch (jwtError) {
      console.error("JWT 검증 오류:", jwtError);
      return NextResponse.json(
        { success: false, message: "인증 토큰이 유효하지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("사용자 정보 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "사용자 정보를 조회할 수 없습니다." },
      { status: 500 }
    );
  }
}
