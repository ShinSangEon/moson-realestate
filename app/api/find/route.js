import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const data = await req.json();

    const result = await prisma.findRequest.create({
      data: {
        phone: data.phone,
        types: data.types,
        dealType: data.dealType,
        leaseTerm: data.leaseTerm || null,
        budget: data.budget, // ← 여기만 수정!
        location: data.location,
        moveIn: data.moveIn,
        note: data.note,
      },
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    console.error("❌ 저장 실패:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
