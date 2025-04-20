import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 한국식 가격 포맷 함수
const formatKoreanMoney = (num) => {
  if (num === null || num === undefined || isNaN(num)) return "정보 없음";
  const eok = Math.floor(num / 100000000);
  const chun = Math.floor((num % 100000000) / 10000000);
  const man = Math.floor((num % 10000000) / 10000);
  let result = "";
  if (eok > 0) result += `${eok}억 `;
  if (chun > 0) result += `${chun}천 `;
  if (eok === 0 && chun === 0 && man > 0) result += `${man}만`;
  if (result === "") result = `${num.toLocaleString()}원`;
  return result.trim();
};

export async function GET(request) {
  try {
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
    const monthlyFee = searchParams.get("monthlyFee");

    const where = {
      isHidden: false,
    };

    if (type) {
      where.type = type;
      console.log("🔍 매물 유형 필터 적용:", where.type);
    }

    if (type === "월세") {
      if (deposit) {
        where.deposit = {
          gte: parseInt(deposit) / 10000,
        };
        console.log("🔍 보증금 필터 적용:", where.deposit);
      }
      if (monthlyFee) {
        where.monthlyFee = {
          gte: parseInt(monthlyFee) / 10000,
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
            _count: {
              select: {
                properties: true,
              },
            },
          },
        },
      },
    });

    // 이미지 JSON 문자열 파싱 및 가격 표시 필드 추가
    const propertiesWithParsedImages = properties.map((property) => ({
      ...property,
      images: JSON.parse(property.images),
      priceDisplay:
        property.type === "월세"
          ? `${property.deposit}/${property.monthlyFee}`
          : formatKoreanMoney(property.price),
      depositDisplay: formatKoreanMoney(property.deposit),
      monthlyFeeDisplay: formatKoreanMoney(property.monthlyFee),
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
