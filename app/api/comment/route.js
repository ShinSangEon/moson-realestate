import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function checkAndAwardBadges(userId) {
  console.log("댓글 뱃지 체크 시작 - 사용자 ID:", userId);

  // 사용자의 댓글 수와 채택된 답변 수 확인
  const [commentCount, acceptedCount] = await Promise.all([
    prisma.comment.count({
      where: { authorId: userId },
    }),
    prisma.comment.count({
      where: {
        authorId: userId,
        isAccepted: true,
      },
    }),
  ]);

  console.log("사용자의 총 댓글 수:", commentCount);
  console.log("사용자의 채택된 답변 수:", acceptedCount);

  const badges = [];
  const badgeConditions = [
    {
      badgeId: "first-answer",
      name: "첫 답변",
      description: "첫 답변을 작성하세요",
      condition: commentCount === 1,
    },
    {
      badgeId: "expert-answerer",
      name: "전문 답변가",
      description: "답변 10개 이상 작성",
      condition: commentCount >= 10,
    },
    {
      badgeId: "answer-king",
      name: "답변왕",
      description: "답변 5개 이상 작성",
      condition: commentCount >= 5,
    },
    {
      badgeId: "accepted-king",
      name: "채택왕",
      description: "답변 3개 이상 채택",
      condition: acceptedCount >= 3,
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

export async function POST(req) {
  try {
    console.log("댓글 작성 API 호출 시작");

    // 인증 확인
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("토큰 존재 여부:", !!token);

    if (!token) {
      console.log("토큰이 없음");
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = parseInt(decoded.userId);
    console.log("사용자 ID:", userId);

    if (isNaN(userId)) {
      console.log("잘못된 사용자 ID");
      return NextResponse.json(
        { success: false, message: "잘못된 사용자 ID입니다." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content, postId, parentId } = body;
    console.log("요청 데이터:", { postId, content, parentId });

    if (!content || !postId) {
      console.log("필수 데이터 누락");
      return NextResponse.json(
        { success: false, message: "내용과 게시글 ID는 필수입니다." },
        { status: 400 }
      );
    }

    // 게시글 정보 조회
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
    });
    console.log("게시글 정보:", post);

    if (!post) {
      console.log("게시글을 찾을 수 없음");
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        agent: true,
      },
    });
    console.log("사용자 정보:", { id: user?.id, role: user?.role });

    if (!user) {
      console.log("사용자를 찾을 수 없음");
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 중개사 전용 게시글인 경우 중개사만 답변 가능
    if (post.isAgentOnly && user.role !== "AGENT") {
      // 게시글 작성자는 대댓글을 작성할 수 있음
      if (parentId && post.authorId === userId) {
        console.log("게시글 작성자가 대댓글 작성 시도");
      } else {
        console.log("중개사 전용 게시글에 일반 사용자가 접근 시도");
        return NextResponse.json(
          {
            success: false,
            message: "공인중개사만 답변할 수 있습니다.",
            error: "AGENT_ONLY",
          },
          { status: 403 }
        );
      }
    }

    // 부모 댓글 확인 (대댓글인 경우)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId) },
        include: {
          author: {
            include: {
              agent: true,
            },
          },
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          {
            success: false,
            message: "부모 댓글을 찾을 수 없습니다.",
            error: "PARENT_COMMENT_NOT_FOUND",
          },
          { status: 404 }
        );
      }

      if (parentComment.postId !== parseInt(postId)) {
        return NextResponse.json(
          {
            success: false,
            message: "잘못된 요청입니다.",
            error: "INVALID_REQUEST",
          },
          { status: 400 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        postId: parseInt(postId),
        authorId: userId,
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            nickname: true,
            rank: true,
            role: true,
            agent: {
              select: {
                officeName: true,
              },
            },
          },
        },
      },
    });

    // 알림 생성
    if (parentId) {
      // 답글인 경우 부모 댓글 작성자에게 알림
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentId) },
        include: {
          author: {
            include: {
              agent: true,
            },
          },
        },
      });

      console.log("부모 댓글 정보:", parentComment);
      console.log("현재 사용자 ID:", userId);

      if (parentComment && parentComment.authorId !== userId) {
        try {
          const notification = await prisma.notification.create({
            data: {
              userId: parentComment.authorId,
              type: "REPLY",
              message: `${
                user.role === "AGENT"
                  ? user.agent?.officeName
                  : user.nickname || user.name
              }님이 회원님의 댓글에 답글을 남겼습니다.`,
              postId: parseInt(postId),
              commentId: comment.id,
              isRead: false,
            },
          });
          console.log("답글 알림 생성 성공:", notification);
        } catch (error) {
          console.error("답글 알림 생성 실패:", error);
        }
      }
    } else {
      // 댓글인 경우 게시글 작성자에게 알림
      const postAuthor = await prisma.user.findUnique({
        where: { id: post.authorId },
        include: {
          agent: true,
        },
      });

      console.log("게시글 작성자 정보:", postAuthor);
      console.log("현재 사용자 ID:", userId);

      if (postAuthor && postAuthor.id !== userId) {
        try {
          const notification = await prisma.notification.create({
            data: {
              userId: postAuthor.id,
              type: "COMMENT",
              message: `${
                user.role === "AGENT"
                  ? user.agent?.officeName
                  : user.nickname || user.name
              }님이 회원님의 게시글에 댓글을 남겼습니다.`,
              postId: parseInt(postId),
              commentId: comment.id,
              isRead: false,
            },
          });
          console.log("댓글 알림 생성 성공:", notification);
        } catch (error) {
          console.error("댓글 알림 생성 실패:", error);
        }
      }
    }

    // 뱃지 획득 확인
    console.log("댓글 작성 완료, 뱃지 체크 시작");
    const earnedBadges = await checkAndAwardBadges(userId);
    console.log("획득한 뱃지:", earnedBadges);

    return NextResponse.json({
      success: true,
      comment,
      earnedBadges,
    });
  } catch (error) {
    console.error("댓글 작성 중 오류:", error);
    return NextResponse.json(
      { success: false, message: "댓글 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
