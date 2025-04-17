import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export async function POST(request) {
  try {
    const { complexUniqueId, title, content, price, userId } =
      await request.json();

    if (!complexUniqueId || !title || !content || !price || !userId) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        complexUniqueId,
        title,
        content,
        price,
        userId,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("보고서 생성 오류:", error);
    return NextResponse.json(
      { error: "보고서를 생성할 수 없습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const complexUniqueId = searchParams.get("complexUniqueId");

    if (!complexUniqueId) {
      return NextResponse.json(
        { error: "complexUniqueId가 필요합니다." },
        { status: 400 }
      );
    }

    const report = await prismaClient.report.findFirst({
      where: {
        complexUniqueId,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // PDF 파일 URL 생성 (실제로는 S3나 다른 스토리지 서비스에서 가져와야 함)
    const fileUrl = `/api/reports/${report.id}/file`;

    return NextResponse.json({
      ...report,
      fileUrl,
    });
  } catch (error) {
    console.error("보고서 조회 오류:", error);
    return NextResponse.json(
      { error: "보고서를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
