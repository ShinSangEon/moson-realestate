import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_, { params }) {
  const { id } = params;

  try {
    // 조회수 증가 + 작성자 정보 포함해서 가져오기
    const post = await prisma.post.update({
      where: { id: Number(id) },
      data: { views: { increment: 1 } },
      include: { author: true },
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error("❌ 게시글 조회 오류:", err);
    return NextResponse.json(
      { success: false, message: "게시글을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
}
