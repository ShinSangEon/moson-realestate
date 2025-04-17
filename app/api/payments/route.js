import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const { reportId, amount, method } = await request.json();

    if (!reportId || !amount || !method) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 보고서 가격과 결제 금액이 일치하는지 확인
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (report.price !== amount) {
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 결제 생성
    const payment = await prisma.payment.create({
      data: {
        reportId,
        amount,
        method,
        status: "completed",
      },
    });

    // 보고서 상태 업데이트
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "completed" },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("결제 처리 오류:", error);
    return NextResponse.json(
      { error: "결제를 처리할 수 없습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId");

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId가 필요합니다." },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { reportId: parseInt(reportId) },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("결제 정보 조회 오류:", error);
    return NextResponse.json(
      { error: "결제 정보를 조회할 수 없습니다." },
      { status: 500 }
    );
  }
}
