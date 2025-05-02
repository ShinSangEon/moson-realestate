import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
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

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                name: true,
                nickname: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("알림 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "알림을 조회할 수 없습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { notificationId } = await request.json();
    const cookieStore = cookies();
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

    // 특정 알림만 읽음 처리
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error);
    return NextResponse.json(
      { success: false, message: "알림 읽음 처리에 실패했습니다." },
      { status: 500 }
    );
  }
}
