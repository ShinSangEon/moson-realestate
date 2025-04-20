import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";

// GET /api/property - 모든 매물 조회
export async function GET(request) {
  try {
    const userId = getAuthUserId(request);
    if (!userId || typeof userId !== "number") {
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요하거나 userId 형식이 잘못되었습니다.",
        },
        { status: 401 }
      );
    }

    const properties = await prisma.property.findMany({
      where: {
        agent: {
          userId: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      properties: properties.map((property) => ({
        ...property,
        images: JSON.parse(property.images),
      })),
    });
  } catch (error) {
    console.error("매물 목록 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 한글 금액을 숫자로 변환하는 함수
const parseKoreanMoney = (str) => {
  let num = 0;
  const eokMatch = str.match(/(\d+)\s*억/);
  const chunMatch = str.match(/(\d+)\s*천/);
  if (eokMatch) num += parseInt(eokMatch[1]) * 100000000;
  if (chunMatch) num += parseInt(chunMatch[1]) * 10000000;
  return num || parseInt(str.replace(/[^0-9]/g, "")); // 숫자만 있으면 그것도
};

// POST /api/property - 새 매물 등록
export async function POST(request) {
  try {
    const userId = await getAuthUserId(request);
    console.log("등록 시 userId:", userId, typeof userId);

    if (!userId || typeof userId !== "number") {
      console.error("userId 오류:", userId);
      return NextResponse.json(
        {
          success: false,
          message: "로그인이 필요하거나 userId가 잘못되었습니다.",
        },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      title,
      address,
      dong,
      complexName,
      type,
      price,
      priceDisplay,
      area,
      pyung,
      floor,
      totalFloors,
      rooms,
      bathrooms,
      maintenanceFee,
      maintenanceDisplay,
      monthlyFee,
      monthlyDisplay,
      deposit,
      depositDisplay,
      direction,
      description,
      images,
      isVerified,
    } = data;

    // 필수 필드 검증
    if (
      !title ||
      !address ||
      !dong ||
      !complexName ||
      !type ||
      !price ||
      !area ||
      !pyung ||
      !floor ||
      !totalFloors ||
      !rooms ||
      !bathrooms ||
      !direction ||
      !description ||
      !images
    ) {
      return NextResponse.json(
        { success: false, message: "필수 정보를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 매물 유형별 필수 필드 검증
    if (type === "월세" && (!monthlyFee || !deposit)) {
      return NextResponse.json(
        {
          success: false,
          message: "월세의 경우 월세와 보증금을 모두 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (type === "전세" && !deposit) {
      return NextResponse.json(
        { success: false, message: "전세의 경우 전세금을 입력해주세요." },
        { status: 400 }
      );
    }

    // 가격 관련 필드 숫자 변환
    const numericPrice = parseKoreanMoney(priceDisplay);
    const numericMonthlyFee = monthlyDisplay
      ? parseKoreanMoney(monthlyDisplay)
      : null;
    const numericDeposit = depositDisplay
      ? parseKoreanMoney(depositDisplay)
      : null;

    // 매물 생성
    const property = await prisma.property.create({
      data: {
        title,
        address,
        dong,
        complexName,
        type,
        price: numericPrice,
        priceDisplay: priceDisplay,
        maintenanceFee,
        maintenanceDisplay,
        monthlyFee: numericMonthlyFee,
        monthlyDisplay: monthlyDisplay,
        deposit: numericDeposit,
        depositDisplay: depositDisplay,
        area: parseFloat(area),
        pyung: parseFloat(pyung),
        floor: parseInt(floor),
        totalFloors: parseInt(totalFloors),
        rooms: parseInt(rooms),
        bathrooms: parseInt(bathrooms),
        direction,
        description,
        images: JSON.stringify(images),
        isVerified: isVerified === "true",
        isHidden: false,
        agent: {
          connect: {
            userId: userId,
          },
        },
      },
    });

    return NextResponse.json({ success: true, property });
  } catch (error) {
    console.error("매물 등록 실패:", error);
    return NextResponse.json(
      { success: false, message: "매물 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
