import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    console.log("시드 데이터 생성 시작...");

    // 중개사 생성
    console.log("중개사 데이터 생성 시도...");
    const agent = await prisma.agent.create({
      data: {
        name: "김부동",
        email: "kim@realestate.com",
        phoneNumber: "010-1234-5678",
        officeName: "부동산중개법인",
        profileImage:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a",
      },
    });
    console.log("중개사 생성 성공:", agent);

    // 매물 생성
    console.log("매물 데이터 생성 시도...");
    const property = await prisma.property.create({
      data: {
        title: "스카이시티프라디움 전용 84.99m²",
        address: "서울특별시 서대문구 가좌동",
        dong: "가좌동",
        complexName: "스카이시티프라디움",
        type: "매매",
        price: 510000000,
        area: 84.99,
        pyung: 25.7,
        floor: 26,
        rooms: 3,
        bathrooms: 2,
        maintenanceFee: 190000,
        direction: "남향",
        description:
          "스카이시티프라디움 전용 84.99m², 26층 전망 좋은 매물입니다. 주차 가능, 관리비 19만원, 실매물입니다.",
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
        ],
        totalFloors: 35,
        isVerified: true,
        isHidden: false,
        lastVerifiedAt: new Date(),
        agentId: agent.id,
      },
    });
    console.log("매물 생성 성공:", property);

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("시드 데이터 생성 오류:", error);
    console.error("에러 메시지:", error.message);
    console.error("에러 스택:", error.stack);

    return NextResponse.json(
      {
        success: false,
        message: "시드 데이터 생성에 실패했습니다.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
