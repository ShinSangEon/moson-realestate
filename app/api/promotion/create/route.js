import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요합니다.",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "관리자만 홍보 게시물을 작성할 수 있습니다.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, imageUrl, startDate, endDate, isFeatured } = body;

    // 기본 게시판 ID를 가져오거나 생성
    let board = await prisma.promotionBoard.findFirst({
      where: { name: "진주시 홍보" },
    });

    if (!board) {
      board = await prisma.promotionBoard.create({
        data: {
          name: "진주시 홍보",
          description: "진주시의 다양한 홍보 정보를 제공합니다.",
        },
      });
    }

    const promotion = await prisma.promotionPost.create({
      data: {
        title,
        content,
        imageUrl,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isFeatured,
        authorId: session.user.id,
        boardId: board.id,
      },
    });

    return NextResponse.json({
      success: true,
      promotion,
    });
  } catch (error) {
    console.error("홍보 게시물 작성 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "홍보 게시물 작성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
