import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = parseInt(decoded.userId);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "잘못된 사용자 ID입니다." },
        { status: 400 }
      );
    }

    const notificationId = parseInt(params.id);

    // 알림이 존재하고 해당 사용자의 것인지 확인
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
        userId: userId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "알림을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 알림 삭제
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("알림 삭제 실패:", error);
    return NextResponse.json(
      { success: false, message: "알림 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
