import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function DELETE(request, context) {
  try {
    const { id } = await context.params;
    const commentId = parseInt(id);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, message: "잘못된 댓글 ID입니다." },
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

    // 댓글 존재 여부 및 작성자 확인
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, message: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (comment.authorId !== userId) {
      return NextResponse.json(
        { success: false, message: "댓글 삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({
      success: true,
      message: "댓글이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("댓글 삭제 중 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "댓글 삭제 중 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
