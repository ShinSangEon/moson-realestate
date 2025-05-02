import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId, type, message, postId, commentId } = await request.json();

    if (!userId || !type || !message) {
      return NextResponse.json(
        { success: false, message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        postId,
        commentId,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("알림 생성 실패:", error);
    return NextResponse.json(
      { success: false, message: "알림 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
