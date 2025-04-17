import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, posts });
  } catch (err) {
    console.error("게시글 불러오기 오류:", err);
    return NextResponse.json(
      { success: false, message: "게시글 조회 실패" },
      { status: 500 }
    );
  }
}
