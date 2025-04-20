import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// ✅ 글로벌 캐시 선언
const emailCodeCache = global.emailCodeCache || new Map();
global.emailCodeCache = emailCodeCache;

export async function POST(req) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json(
      { success: false, message: "이메일이 필요합니다." },
      { status: 400 }
    );
  }

  const verifyCode = uuidv4().slice(0, 6).toUpperCase();

  const transporter = nodemailer.createTransport({
    host: "smtp.naver.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Moson 부동산" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "📮 Moson 부동산 이메일 인증 코드",
    text: `인증 코드: ${verifyCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ 인증 이메일 전송 완료:", verifyCode);

    // 🔐 인증 코드 저장 (5분간 유효)
    emailCodeCache.set(email, {
      code: verifyCode,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ 이메일 전송 실패:", error);
    return NextResponse.json(
      { success: false, message: "이메일 전송 실패" },
      { status: 500 }
    );
  }
}
