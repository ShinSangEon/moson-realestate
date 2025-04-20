import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  const { name, phoneNumber } = await req.json();

  if (!name || !phoneNumber) {
    return NextResponse.json(
      { success: false, message: "이름과 전화번호를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      name,
      phoneNumber,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { success: false, message: "일치하는 회원이 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, email: user.email });
}
