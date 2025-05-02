import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: { answers: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "답변을 채택할 권한이 없습니다." },
        { status: 403 }
      );
    }

    const answer = post.answers.find((a) => a.id === params.answerId);
    if (!answer) {
      return NextResponse.json(
        { success: false, message: "답변을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 기존 채택된 답변 해제
    await prisma.answer.updateMany({
      where: {
        postId: params.id,
        isAccepted: true,
      },
      data: {
        isAccepted: false,
      },
    });

    // 새로운 답변 채택
    await prisma.answer.update({
      where: { id: params.answerId },
      data: { isAccepted: true },
    });

    // 게시글 상태 업데이트
    await prisma.post.update({
      where: { id: params.id },
      data: { isAnswered: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("답변 채택 실패:", error);
    return NextResponse.json(
      { success: false, message: "답변 채택에 실패했습니다." },
      { status: 500 }
    );
  }
}
