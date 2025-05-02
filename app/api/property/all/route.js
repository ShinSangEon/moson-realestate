import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    // 인증 확인
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = parseInt(decoded.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "잘못된 사용자 ID입니다" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minPyung = searchParams.get("minPyung");
    const maxPyung = searchParams.get("maxPyung");
    const dong = searchParams.get("dong");
    const complexName = searchParams.get("complexName");
    const isVerified = searchParams.get("isVerified");

    // 월세일 경우 보증금, 월세 범위 필터
    const deposit = searchParams.get("deposit");
    const monthlyFee = searchParams.get("monthly");

    const where = {
      isHidden: false,
      agent: {
        userId: userId,
      },
    };

    if (type) {
      where.type = type;
      console.log("🔍 매물 유형 필터 적용:", where.type);
    }

    if (type === "월세") {
      if (deposit !== null) {
        where.deposit = {
          gte: parseInt(deposit),
        };
        console.log("🔍 보증금 필터 적용:", where.deposit);
      }
      if (monthlyFee !== null) {
        where.monthlyFee = {
          gte: parseInt(monthlyFee),
        };
        console.log("🔍 월세 필터 적용:", where.monthlyFee);
      }
    } else if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseInt(minPrice);
        console.log("🔍 최소 가격 필터 적용:", where.price.gte);
      }
      if (maxPrice) {
        where.price.lte = parseInt(maxPrice);
        console.log("🔍 최대 가격 필터 적용:", where.price.lte);
      }
    }

    if (minPyung || maxPyung) {
      where.pyung = {};
      if (minPyung) {
        where.pyung.gte = parseFloat(minPyung);
        console.log("🔍 최소 평수 필터 적용:", where.pyung.gte);
      }
      if (maxPyung) {
        where.pyung.lte = parseFloat(maxPyung);
        console.log("🔍 최대 평수 필터 적용:", where.pyung.lte);
      }
    }

    if (dong) {
      where.dong = dong;
      console.log("🔍 동 필터 적용:", where.dong);
    }

    if (complexName) {
      where.complexName = {
        contains: complexName,
      };
      console.log("🔍 단지명 필터 적용:", where.complexName);
    }

    if (isVerified !== null) {
      where.isVerified = isVerified === "true";
      console.log("🔍 실매물 필터 적용:", where.isVerified);
    }

    console.log("🔍 전체 필터 조건:", where);

    const properties = await prisma.property.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        agent: {
          include: {
            user: true,
          },
        },
      },
    });

    // 이미지 JSON 문자열 파싱
    const propertiesWithParsedImages = properties.map((property) => ({
      ...property,
      images: JSON.parse(property.images),
    }));

    return NextResponse.json({
      success: true,
      properties: propertiesWithParsedImages,
    });
  } catch (error) {
    console.error("❌ 매물 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물을 조회하는데 실패했습니다" },
      { status: 500 }
    );
  }
}
