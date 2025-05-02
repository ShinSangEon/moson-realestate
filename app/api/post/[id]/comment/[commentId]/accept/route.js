import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
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

    const { id, commentId } = await params;
    const postId = parseInt(id);
    const commentIdNum = parseInt(commentId);

    // 게시글 작성자 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (post.authorId !== userId) {
      return NextResponse.json(
        {
          success: false,
          message: "게시글 작성자만 답변을 채택할 수 있습니다.",
        },
        { status: 403 }
      );
    }

    // 댓글 존재 확인
    const comment = await prisma.comment.findUnique({
      where: { id: commentIdNum },
      select: { postId: true, isAccepted: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (comment.postId !== postId) {
      return NextResponse.json(
        { success: false, message: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    if (comment.isAccepted) {
      return NextResponse.json(
        { success: false, message: "이미 채택된 답변이 있습니다." },
        { status: 400 }
      );
    }

    // 채택 처리
    await prisma.comment.update({
      where: { id: commentIdNum },
      data: { isAccepted: true },
    });

    // 채택 알림 생성
    const targetComment = await prisma.comment.findUnique({
      where: { id: commentIdNum },
      select: { authorId: true },
    });

    console.log("답변 작성자 ID:", targetComment?.authorId);
    console.log("현재 사용자 ID:", userId);

    if (targetComment && targetComment.authorId !== userId) {
      try {
        const notification = await prisma.notification.create({
          data: {
            userId: targetComment.authorId,
            type: "ACCEPT",
            message: "회원님의 답변이 채택되었습니다!",
            postId: postId,
            commentId: commentIdNum,
          },
        });
        console.log("채택 알림 생성 성공:", notification);
      } catch (error) {
        console.error("채택 알림 생성 실패:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("답변 채택 오류:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function getBadgeDescription(name) {
  switch (name) {
    case "FIRST_ANSWER":
      return "첫 번째 답변 채택";
    case "EXPERT_ANSWERER":
      return "10개의 답변 채택";
    case "MASTER_ANSWERER":
      return "50개의 답변 채택";
    default:
      return "";
  }
}

function getBadgeImageUrl(name) {
  switch (name) {
    case "FIRST_ANSWER":
      return "/badges/first-answer.png";
    case "EXPERT_ANSWERER":
      return "/badges/expert-answerer.png";
    case "MASTER_ANSWERER":
      return "/badges/master-answerer.png";
    default:
      return "";
  }
}
