import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";

export const passwordResetCache = new Map();

export async function POST(req) {
  const { email, name, phoneNumber } = await req.json();

  if (!email || !name || !phoneNumber) {
    return NextResponse.json(
      { success: false, message: "이메일, 이름, 전화번호가 필요합니다." },
      { status: 400 }
    );
  }

  // 🔎 DB에서 사용자 정보 확인
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.name !== name || user.phoneNumber !== phoneNumber) {
    return NextResponse.json(
      { success: false, message: "일치하는 회원 정보가 없습니다." },
      { status: 404 }
    );
  }

  const verifyCode = uuidv4().slice(0, 6).toUpperCase();

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.naver.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `Moson 부동산 <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "🔐 Moson 비밀번호 재설정 인증코드",
      text: `인증 코드: ${verifyCode}`,
    });

    passwordResetCache.set(email, {
      code: verifyCode,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("이메일 전송 실패:", err);
    return NextResponse.json(
      { success: false, message: "메일 전송 실패" },
      { status: 500 }
    );
  }
}

export { passwordResetCache };
