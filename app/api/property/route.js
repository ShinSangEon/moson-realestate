import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/property - 모든 매물 조회
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, properties });
  } catch (error) {
    console.error("매물 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/property - 새 매물 등록
export async function POST(request) {
  try {
    const data = await request.json();

    // 필수 필드 검증
    const requiredFields = [
      "title",
      "address",
      "dong",
      "complexName",
      "type",
      "price",
      "area",
      "pyung",
      "floor",
      "totalFloors",
      "rooms",
      "bathrooms",
      "maintenanceFee",
      "direction",
      "description",
      "images",
      "agentId",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, message: `${field} 필드는 필수입니다.` },
          { status: 400 }
        );
      }
    }

    // 매물 등록
    const property = await prisma.property.create({
      data: {
        title: data.title,
        address: data.address,
        dong: data.dong,
        complexName: data.complexName,
        type: data.type,
        price: data.price,
        area: data.area,
        pyung: data.pyung,
        floor: data.floor,
        totalFloors: data.totalFloors,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        maintenanceFee: data.maintenanceFee,
        direction: data.direction,
        description: data.description,
        images: data.images,
        isVerified: data.isVerified,
        agentId: data.agentId,
      },
    });

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("매물 등록 오류:", error);
    return NextResponse.json(
      { success: false, message: "매물 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
