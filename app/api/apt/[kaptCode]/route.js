import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 평형대 그룹화 함수
function getAreaGroup(area) {
  if (area < 60) return "59㎡ 이하";
  if (area < 85) return "84㎡ 이하";
  if (area < 102) return "101㎡ 이하";
  return "102㎡ 초과";
}

export async function GET(request, { params }) {
  try {
    const { kaptCode } = params;

    // 기본 정보 조회
    const basicInfo = await prisma.apartmentBasicInfo.findUnique({
      where: { kaptCode },
    });

    if (!basicInfo) {
      return NextResponse.json(
        { success: false, message: "아파트 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상세 정보 조회
    const detailedInfo = await prisma.apartmentDetailedInfo.findUnique({
      where: { kaptCode },
    });

    // 거래 내역 조회 (최근 10건)
    const transactions = await prisma.apartmentTransaction.findMany({
      where: { kaptCode },
      orderBy: [
        { dealYear: "desc" },
        { dealMonth: "desc" },
        { dealDay: "desc" },
      ],
      take: 10,
    });

    // 평형별 시세 계산
    const areaGroups = {};
    transactions.forEach((t) => {
      const group = getAreaGroup(t.area);
      if (!areaGroups[group]) {
        areaGroups[group] = { sale: [], rent: [] };
      }

      if (t.dealType === "매매" && t.saleAmount) {
        areaGroups[group].sale.push(t.saleAmount);
      } else if (t.dealType === "전세" && t.depositAmount) {
        areaGroups[group].rent.push(t.depositAmount);
      }
    });

    // 평형별 평균 시세 계산
    const areaStats = Object.entries(areaGroups).map(([group, data]) => ({
      group,
      avgSale: data.sale.length
        ? Math.round(data.sale.reduce((a, b) => a + b) / data.sale.length)
        : null,
      avgRent: data.rent.length
        ? Math.round(data.rent.reduce((a, b) => a + b) / data.rent.length)
        : null,
      saleCount: data.sale.length,
      rentCount: data.rent.length,
    }));

    // 전체 거래 내역에서 평균 매매가, 전세가 계산
    const avgPrices = await prisma.apartmentTransaction.groupBy({
      by: ["dealType"],
      where: { kaptCode },
      _avg: {
        saleAmount: true,
        depositAmount: true,
      },
    });

    // 평균 매매가, 전세가 추출
    const avgSale =
      avgPrices.find((p) => p.dealType === "매매")?._avg.saleAmount || null;
    const avgRent =
      avgPrices.find((p) => p.dealType === "전세")?._avg.depositAmount || null;
    const rentRate =
      avgSale && avgRent ? Math.round((avgRent / avgSale) * 100) : null;

    return NextResponse.json({
      success: true,
      data: {
        basicInfo,
        detailedInfo,
        transactions,
        areaStats,
        avgSale,
        avgRent,
        rentRate,
      },
    });
  } catch (error) {
    console.error("❌ 아파트 정보 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
