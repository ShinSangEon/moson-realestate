import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const {
      title,
      address,
      price,
      area,
      maintenanceFee,
      floor,
      direction,
      description,
      images,
      agentId,
    } = await request.json();

    // 필수 필드 검증
    if (!title || !address || !price || !area || !agentId) {
      return NextResponse.json(
        { success: false, message: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 매물 생성
    const property = await prisma.property.create({
      data: {
        title,
        address,
        price: parseInt(price),
        area: parseFloat(area),
        maintenanceFee: parseInt(maintenanceFee),
        floor: parseInt(floor),
        direction,
        description,
        images: JSON.stringify(images),
        agentId,
      },
    });

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("매물 등록 중 오류 발생:", error);
    return NextResponse.json(
      { success: false, message: "매물 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
