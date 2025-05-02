import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const transactions = await prisma.apartmentTransaction.findMany({
      select: {
        kaptCode: true,
        aptNm: true,
        dealType: true,
        saleAmount: true,
        depositAmount: true,
      },
    });

    // 단지별로 그룹화
    const complexMap = {};

    transactions.forEach((transaction) => {
      const { kaptCode, aptNm, dealType, saleAmount, depositAmount } =
        transaction;

      if (!complexMap[kaptCode]) {
        complexMap[kaptCode] = {
          kaptCode,
          aptNm,
          totalSale: 0,
          saleCount: 0,
          totalRent: 0,
          rentCount: 0,
        };
      }

      if (dealType === "매매" && saleAmount) {
        complexMap[kaptCode].totalSale += saleAmount;
        complexMap[kaptCode].saleCount++;
      }

      if (dealType === "전세" && depositAmount) {
        complexMap[kaptCode].totalRent += depositAmount;
        complexMap[kaptCode].rentCount++;
      }
    });

    // 단지별 평균 계산
    const result = Object.values(complexMap).map((complex) => {
      const avgSale =
        complex.saleCount > 0
          ? Math.round(complex.totalSale / complex.saleCount)
          : null;
      const avgRent =
        complex.rentCount > 0
          ? Math.round(complex.totalRent / complex.rentCount)
          : null;
      const rentRate =
        avgSale && avgRent ? Math.round((avgRent / avgSale) * 100) : null;

      return {
        kaptCode: complex.kaptCode,
        aptNm: complex.aptNm,
        avgSale,
        avgRent,
        rentRate,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("단지별 요약 데이터 조회 중 오류 발생:", error);
    return NextResponse.json(
      { success: false, error: "단지별 데이터 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
