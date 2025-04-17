import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function POST(req) {
  const userId = getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const { content, postId, parentId } = await req.json();

    if (!content || !postId) {
      return NextResponse.json(
        { success: false, message: "내용 또는 게시글 ID가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 댓글 저장
    const newComment = await prisma.comment.create({
      data: {
        content,
        postId: Number(postId),
        authorId: userId,
        parentId: parentId ? Number(parentId) : null,
      },
    });

    // 알림 저장 (본인이 자기 글에 쓴 댓글은 제외)
    const post = await prisma.post.findUnique({
      where: { id: Number(postId) },
      select: { authorId: true },
    });

    if (post?.authorId && post.authorId !== userId) {
      await prisma.notification.create({
        data: {
          type: "comment",
          message: "회원님의 게시글에 새로운 댓글이 달렸습니다.",
          userId: post.authorId,
        },
      });
    }

    return NextResponse.json({ success: true, comment: newComment });
  } catch (err) {
    console.error("댓글 작성 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}
