import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        badges: true,
        posts: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        comments: {
          where: { isAccepted: true },
          select: {
            id: true,
            content: true,
            createdAt: true,
            post: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 랭킹 계산
    const rank = calculateRank(user.acceptedAnswersCount);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        rank,
      },
    });
  } catch (error) {
    console.error("사용자 프로필 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function calculateRank(acceptedAnswersCount) {
  if (acceptedAnswersCount >= 100) return "DIAMOND";
  if (acceptedAnswersCount >= 50) return "PLATINUM";
  if (acceptedAnswersCount >= 20) return "GOLD";
  if (acceptedAnswersCount >= 10) return "SILVER";
  return "BRONZE";
}
