import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    const properties = await prisma.property.findMany({
      where: agentId ? { agentId } : {},
      orderBy: {
        createdAt: "desc",
      },
    });

    // 이미지 문자열을 JSON으로 파싱
    const propertiesWithParsedImages = properties.map((property) => ({
      ...property,
      images: JSON.parse(property.images),
    }));

    return NextResponse.json({
      success: true,
      properties: propertiesWithParsedImages,
    });
  } catch (error) {
    console.error("매물 목록 조회 중 오류 발생:", error);
    return NextResponse.json(
      { success: false, message: "매물 목록 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
