import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function checkAndAwardBadges(userId) {
  console.log("답변 뱃지 체크 시작 - 사용자 ID:", userId);

  // 사용자의 답변 수 확인
  const answerCount = await prisma.answer.count({
    where: { authorId: userId },
  });

  console.log("사용자의 총 답변 수:", answerCount);

  const badges = [];
  const badgeConditions = [
    {
      badgeId: "first-answer",
      name: "첫 답변",
      description: "첫 답변을 작성하세요",
      condition: answerCount === 1,
    },
    {
      badgeId: "answer-king",
      name: "답변왕",
      description: "답변 5개 이상 작성",
      condition: answerCount >= 5,
    },
  ];

  for (const { badgeId, name, description, condition } of badgeConditions) {
    console.log(`뱃지 체크 중: ${name}, 조건 충족 여부:`, condition);
    if (condition) {
      try {
        // 뱃지 생성 (없는 경우)
        const badge = await prisma.badge.upsert({
          where: { badgeId },
          update: {},
          create: {
            badgeId,
            name,
            description,
            imageUrl: `/badges/${badgeId}.svg`,
          },
        });

        console.log("뱃지 생성/조회 완료:", badge);

        // 이미 획득한 뱃지인지 확인
        const hasEarned = await prisma.user.findFirst({
          where: {
            id: userId,
            badges: {
              some: {
                id: badge.id,
              },
            },
          },
        });

        console.log("이미 획득한 뱃지 여부:", hasEarned ? "예" : "아니오");

        if (!hasEarned) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              badges: {
                connect: { id: badge.id },
              },
            },
          });

          // 뱃지 획득 알림 생성
          await prisma.notification.create({
            data: {
              userId: userId,
              type: "BADGE",
              message: `축하합니다! ${name} 뱃지를 획득했습니다!`,
              isRead: false,
            },
          });

          console.log(`새로운 뱃지 획득! - ${name}`);
          badges.push(badge);
        }
      } catch (error) {
        console.error(`뱃지 처리 중 오류 발생 (${name}):`, error);
      }
    }
  }

  console.log("최종 획득한 뱃지들:", badges);
  return badges;
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, message: "답변 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        postId: params.id,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            isRealtor: true,
            badges: true,
          },
        },
      },
    });

    // 뱃지 획득 확인
    console.log("뱃지 체크 시작");
    const earnedBadges = await checkAndAwardBadges(session.user.id);
    console.log("획득한 뱃지:", earnedBadges);

    return NextResponse.json({
      success: true,
      answer: {
        ...answer,
        isLiked: false,
        likeCount: 0,
      },
      earnedBadges,
    });
  } catch (error) {
    console.error("답변 작성 실패:", error);
    return NextResponse.json(
      { success: false, message: "답변 작성에 실패했습니다." },
      { status: 500 }
    );
  }
}
