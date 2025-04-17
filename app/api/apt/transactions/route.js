import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const complexUniqueId = searchParams.get("complexUniqueId");

    if (!complexUniqueId) {
      return NextResponse.json(
        { error: "complexUniqueId가 필요합니다." },
        { status: 400 }
      );
    }

    const transactions = await prisma.apartment_Transaction.findMany({
      where: { complexUniqueId },
      orderBy: [
        { dealYear: "desc" },
        { dealMonth: "desc" },
        { dealDay: "desc" },
      ],
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("거래 기록 조회 오류:", error);
    return NextResponse.json(
      { error: "거래 기록을 조회할 수 없습니다." },
      { status: 500 }
    );
  }
}
