import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

export async function DELETE(_, { params }) {
  const userId = getAuthUserId();

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const commentId = parseInt(params.id);

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { author: true },
  });

  if (!comment) {
    return NextResponse.json(
      { success: false, message: "댓글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 본인 또는 관리자만 삭제 가능
  const isAdmin = comment.author?.role === "admin";
  if (comment.authorId !== userId && !isAdmin) {
    return NextResponse.json(
      { success: false, message: "삭제 권한이 없습니다." },
      { status: 403 }
    );
  }

  // 대댓글도 같이 삭제
  await prisma.comment.deleteMany({ where: { parentId: commentId } });
  await prisma.comment.delete({ where: { id: commentId } });

  return NextResponse.json({ success: true });
}
