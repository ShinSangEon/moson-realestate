import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ✅ DB 연결 경로

export async function POST(req) {
  try {
    const body = await req.json();
    const { title, content, imageUrl, category } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "제목과 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        imageUrl: imageUrl || null,
        category: category || "잡담",
        views: 0,
      },
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error("게시글 저장 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류 발생" },
      { status: 500 }
    );
  }
}
