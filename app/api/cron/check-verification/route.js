import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 7일 이상 확인되지 않은 매물 조회
    const unverifiedProperties = await prisma.property.findMany({
      where: {
        OR: [
          { lastVerifiedAt: { lt: sevenDaysAgo } },
          { lastVerifiedAt: null },
        ],
        isVerified: true,
        isHidden: false,
      },
    });

    // 숨김 처리
    for (const property of unverifiedProperties) {
      await prisma.property.update({
        where: { id: property.id },
        data: {
          isHidden: true,
          isVerified: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${unverifiedProperties.length}개의 매물이 숨김 처리되었습니다.`,
    });
  } catch (error) {
    console.error("실제매물 확인 체크 오류:", error);
    return NextResponse.json(
      { success: false, message: "실제매물 확인 체크에 실패했습니다." },
      { status: 500 }
    );
  }
}
