import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();

    const result = await prisma.sellRequest.create({
      data: {
        phone: body.phone,
        propertyType: body.types,
        location: body.location,
        price: body.price,
        dealType: body.dealType,
        note: body.note || "",
      },
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    console.error("❌ 팔아줘 요청 저장 실패:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
