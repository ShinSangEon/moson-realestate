import { NextResponse } from "next/server";
import { passwordResetCache } from "../request-reset/route";

export async function POST(req) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json(
      { success: false, message: "이메일과 인증 코드가 필요합니다." },
      { status: 400 }
    );
  }

  const saved = passwordResetCache.get(email);

  if (!saved) {
    return NextResponse.json(
      { success: false, message: "인증 코드가 존재하지 않습니다." },
      { status: 404 }
    );
  }

  const isExpired = Date.now() - saved.createdAt > 5 * 60 * 1000;
  if (isExpired) {
    passwordResetCache.delete(email);
    return NextResponse.json(
      { success: false, message: "인증 코드가 만료되었습니다." },
      { status: 410 }
    );
  }

  if (saved.code !== code.toUpperCase()) {
    return NextResponse.json(
      { success: false, message: "인증 코드가 일치하지 않습니다." },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
