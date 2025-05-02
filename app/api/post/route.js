import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma"; // ✅ DB 연결 경로

async function checkAndAwardBadges(userId) {
  // 사용자의 게시글 수와 받은 좋아요 수 확인
  const [postCount, totalLikes] = await Promise.all([
    prisma.post.count({
      where: { authorId: userId },
    }),
    prisma.post
      .findMany({
        where: { authorId: userId },
        include: {
          _count: {
            select: { likes: true },
          },
        },
      })
      .then((posts) => posts.reduce((sum, post) => sum + post._count.likes, 0)),
  ]);

  const badges = [];
  const badgeConditions = [
    {
      badgeId: "first-post",
      name: "첫 게시글",
      description: "첫 게시글을 작성하세요",
      condition: postCount === 1,
    },
    {
      badgeId: "popular",
      name: "인기 작성자",
      description: "좋아요 10개 이상 받기",
      condition: totalLikes >= 10,
    },
    {
      badgeId: "community-star",
      name: "커뮤니티 스타",
      description: "좋아요 50개 이상 받기",
      condition: totalLikes >= 50,
    },
  ];

  for (const { badgeId, name, description, condition } of badgeConditions) {
    if (condition) {
      const badge = await prisma.badge.findUnique({
        where: { badgeId },
      });

      if (badge) {
        // 이미 획득한 뱃지인지 확인
        const hasEarned = await prisma.user.findFirst({
          where: {
            id: userId,
            badges: {
              some: {
                badgeId: badge.badgeId,
              },
            },
          },
        });

        if (!hasEarned) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              badges: {
                connect: { badgeId: badge.badgeId },
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

          badges.push({
            id: badge.id,
            badgeId: badge.badgeId,
            name: badge.name,
            description: badge.description,
            imageUrl: badge.imageUrl,
          });
        }
      }
    }
  }

  return badges;
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = parseInt(decoded.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "잘못된 사용자 ID입니다." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, content, category, imageUrl, isAgentOnly } = body;

    // 필수 필드 검증
    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, message: "제목, 내용, 카테고리는 필수입니다." },
        { status: 400 }
      );
    }

    // 공인중개사에게 묻기 카테고리인 경우 자동으로 isAgentOnly를 true로 설정
    const isAgentQuestion = category === "공인중개사에게 묻기";

    // 게시글 작성
    const post = await prisma.post.create({
      data: {
        title,
        content,
        category,
        imageUrl,
        isAgentOnly: isAgentQuestion || isAgentOnly || false,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            nickname: true,
            rank: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
                nickname: true,
                rank: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // 뱃지 획득 확인
    console.log("뱃지 체크 시작");
    const earnedBadges = await checkAndAwardBadges(userId);
    console.log("획득한 뱃지:", earnedBadges);

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        isLiked: false,
        isBookmarked: false,
      },
      earnedBadges,
    });
  } catch (error) {
    console.error("게시글 작성 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
