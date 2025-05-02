import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 현재 시간을 기준으로 24시간 이내의 조회수를 확인
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentView = await prisma.postView.findFirst({
      where: {
        postId: postId,
        viewedAt: {
          gte: oneDayAgo,
        },
      },
    });

    // 24시간 이내에 조회한 기록이 없을 때만 조회수 증가
    if (!recentView) {
      await prisma.$transaction([
        prisma.post.update({
          where: { id: postId },
          data: {
            views: {
              increment: 1,
            },
          },
        }),
        prisma.postView.create({
          data: {
            postId: postId,
          },
        }),
      ]);
    }

    // 로그인 상태 확인
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let userId = null;
    let isLiked = false;
    let isBookmarked = false;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = parseInt(decoded.userId);

        if (!isNaN(userId)) {
          const [like, bookmark] = await Promise.all([
            prisma.like.findUnique({
              where: {
                userId_postId: {
                  userId,
                  postId,
                },
              },
            }),
            prisma.bookmark.findUnique({
              where: {
                userId_postId: {
                  userId,
                  postId,
                },
              },
            }),
          ]);

          isLiked = !!like;
          isBookmarked = !!bookmark;
        }
      } catch (error) {
        console.error("토큰 검증 오류:", error);
      }
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profileImage: true,
            role: true,
            rank: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                profileImage: true,
                role: true,
                rank: true,
                agent: {
                  select: {
                    officeName: true,
                  },
                },
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    nickname: true,
                    profileImage: true,
                    role: true,
                    rank: true,
                    agent: {
                      select: {
                        officeName: true,
                      },
                    },
                  },
                },
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

    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        isLiked,
        isBookmarked,
      },
    });
  } catch (error) {
    console.error("게시글 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "게시글을 조회할 수 없습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, message: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 인증 확인
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

    // 게시글 존재 여부 및 작성자 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        comments: {
          where: { isAccepted: true },
          select: { id: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (post.authorId !== userId) {
      return NextResponse.json(
        { success: false, message: "게시글 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 채택된 답변이 있는 경우 삭제 불가
    if (post.comments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "채택된 답변이 있어 게시글을 삭제할 수 없습니다.",
          error: "ACCEPTED_COMMENT_EXISTS",
        },
        { status: 400 }
      );
    }

    // 게시글 삭제
    try {
      // 트랜잭션으로 모든 관련 데이터 삭제
      await prisma.$transaction(async (tx) => {
        // 1. 게시글의 좋아요 삭제
        await tx.like.deleteMany({
          where: { postId: postId },
        });

        // 2. 게시글의 북마크 삭제
        await tx.bookmark.deleteMany({
          where: { postId: postId },
        });

        // 3. 게시글의 조회수 기록 삭제
        await tx.postView.deleteMany({
          where: { postId: postId },
        });

        // 4. 게시글의 댓글 삭제
        await tx.comment.deleteMany({
          where: { postId: postId },
        });

        // 5. 마지막으로 게시글 삭제
        await tx.post.delete({
          where: { id: postId },
        });
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      return NextResponse.json(
        {
          success: false,
          message: "게시글 삭제 중 오류가 발생했습니다.",
          error:
            error.code === "P2003" ? "FOREIGN_KEY_CONSTRAINT" : "UNKNOWN_ERROR",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("게시글 삭제 중 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "게시글 삭제 중 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
