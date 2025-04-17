import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/property/search - 매물 검색
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const minPrice = parseInt(searchParams.get("minPrice")) || 0;
    const maxPrice =
      parseInt(searchParams.get("maxPrice")) || Number.MAX_SAFE_INTEGER;
    const minArea = parseFloat(searchParams.get("minArea")) || 0;
    const maxArea =
      parseFloat(searchParams.get("maxArea")) || Number.MAX_SAFE_INTEGER;
    const type = searchParams.get("type") || ""; // 매매, 전세, 월세
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;

    const where = {
      AND: [
        {
          OR: [
            { title: { contains: query } },
            { address: { contains: query } },
            { description: { contains: query } },
          ],
        },
        {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
        {
          area: {
            gte: minArea,
            lte: maxArea,
          },
        },
      ],
    };

    if (type) {
      where.type = type;
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("매물 검색 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물 검색에 실패했습니다." },
      { status: 500 }
    );
  }
}
