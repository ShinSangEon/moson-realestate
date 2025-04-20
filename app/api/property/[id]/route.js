import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/property/[id] - 특정 매물 상세 조회
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: "매물을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      property: {
        ...property,
        price: property.price,
        priceDisplay: property.priceDisplay,
        maintenanceFee: property.maintenanceFee,
        maintenanceDisplay: property.maintenanceDisplay,
      },
    });
  } catch (error) {
    console.error("매물 상세 조회 오류:", error);
    return NextResponse.json(
      { success: false, message: "매물 상세 정보를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/property/[id] - 매물 정보 수정
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    const property = await prisma.property.update({
      where: { id },
      data: {
        title: data.title,
        address: data.address,
        price: data.price,
        area: data.area,
        maintenanceFee: data.maintenanceFee,
        floor: data.floor,
        direction: data.direction,
        description: data.description,
        images: JSON.stringify(data.images),
      },
    });

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("매물 수정 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/property/[id] - 매물 삭제
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "매물이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("매물 삭제 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
