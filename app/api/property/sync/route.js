import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// API 키 검증 미들웨어
async function validateApiKey(request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return false;
  }

  const validKey = await prisma.apiKey.findFirst({
    where: {
      key: apiKey,
      isActive: true,
    },
  });

  return validKey;
}

export async function POST(request) {
  try {
    // API 키 검증
    const isValid = await validateApiKey(request);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않은 API 키입니다.",
        },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { properties } = data;

    // 매물 데이터 검증
    if (!Array.isArray(properties)) {
      return NextResponse.json(
        {
          success: false,
          message: "잘못된 데이터 형식입니다.",
        },
        { status: 400 }
      );
    }

    // 매물 데이터 저장
    const savedProperties = [];
    for (const property of properties) {
      try {
        const savedProperty = await prisma.property.create({
          data: {
            title: property.title,
            address: property.address,
            price: parseInt(property.price),
            area: parseFloat(property.area),
            maintenanceFee: parseInt(property.maintenanceFee),
            floor: parseInt(property.floor),
            direction: property.direction,
            description: property.description,
            images: JSON.stringify(property.images),
            agentId: 1, // 기본 관리자 ID
          },
        });
        savedProperties.push(savedProperty);
      } catch (error) {
        console.error(`매물 저장 실패: ${property.title}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "매물 동기화가 완료되었습니다.",
      savedCount: savedProperties.length,
    });
  } catch (error) {
    console.error("매물 동기화 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "매물 동기화에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

// API 키 생성 엔드포인트
export async function GET() {
  try {
    const apiKey = crypto.randomBytes(32).toString("hex");

    const newApiKey = await prisma.apiKey.create({
      data: {
        key: apiKey,
        name: "새로운 API 키",
        description: "자동 생성된 API 키",
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: newApiKey.key,
    });
  } catch (error) {
    console.error("API 키 생성 실패:", error);
    return NextResponse.json(
      {
        success: false,
        message: "API 키 생성에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
