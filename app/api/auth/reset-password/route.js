import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: "이메일과 새 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "존재하지 않는 사용자입니다." },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "비밀번호 변경 완료" });
  } catch (err) {
    console.error("❌ 비밀번호 재설정 오류:", err);
    return NextResponse.json(
      { success: false, message: "비밀번호 재설정에 실패했습니다." },
      { status: 500 }
    );
  }
}
