import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  try {
    const { id } = params;

    // 매물 정보 조회
    const property = await prisma.property.findUnique({
      where: { id },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: "매물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 실제매물 확인 처리
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        isVerified: true,
        isHidden: false,
        lastVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, property: updatedProperty });
  } catch (error) {
    console.error("실제매물 확인 오류:", error);
    return NextResponse.json(
      { success: false, message: "실제매물 확인에 실패했습니다." },
      { status: 500 }
    );
  }
}
