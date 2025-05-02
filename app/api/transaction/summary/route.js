import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  try {
    const transactions = await prisma.apartment_Transaction.findMany({
      where: {
        createdAt: {
          gte: lastMonth,
        },
      },
    });

    const grouped = transactions.reduce(
      (acc, t) => {
        acc.count++;
        acc.total += t.dealAmount;
        return acc;
      },
      { count: 0, total: 0 }
    );

    const avgPrice =
      grouped.count > 0 ? Math.round(grouped.total / grouped.count) : 0;

    return NextResponse.json({
      success: true,
      count: grouped.count,
      averagePrice: avgPrice,
    });
  } catch (error) {
    console.error("❌ 거래 요약 조회 실패:", error);
    return NextResponse.json(
      { success: false, message: "서버 오류" },
      { status: 500 }
    );
  }
}
