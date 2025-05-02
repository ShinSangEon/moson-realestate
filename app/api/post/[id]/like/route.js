import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request, context) {
  try {
    console.log("좋아요 요청 시작");
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    console.log("토큰:", token ? "존재" : "없음");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("토큰 디코딩 성공:", decoded);
    } catch (error) {
      console.error("토큰 검증 실패:", error);
      return NextResponse.json(
        { success: false, message: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);
    console.log("사용자 ID:", userId);

    if (isNaN(userId)) {
      console.error("잘못된 사용자 ID:", decoded.userId);
      return NextResponse.json(
        { success: false, message: "잘못된 사용자 ID입니다." },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const postId = parseInt(id);
    console.log("게시글 ID:", postId);

    if (isNaN(postId)) {
      console.error("잘못된 게시글 ID:", id);
      return NextResponse.json(
        { success: false, message: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 게시글 존재 여부 확인
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      console.error("게시글을 찾을 수 없음:", postId);
      return NextResponse.json(
        { success: false, message: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 좋아요를 눌렀는지 확인
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    console.log("기존 좋아요 상태:", existingLike ? "있음" : "없음");

    if (existingLike) {
      // 좋아요 취소
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      console.log("좋아요 취소 완료");
      return NextResponse.json({
        success: true,
        isLiked: false,
        likeCount: post._count.likes - 1,
      });
    } else {
      // 좋아요 추가
      await prisma.like.create({
        data: {
          userId,
          postId,
        },
      });

      console.log("좋아요 추가 완료");
      return NextResponse.json({
        success: true,
        isLiked: true,
        likeCount: post._count.likes + 1,
      });
    }
  } catch (error) {
    console.error("좋아요 처리 중 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "좋아요 처리 중 오류가 발생했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
