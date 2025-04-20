import { NextResponse } from "next/server";

// ✅ 글로벌 캐시 선언
const emailCodeCache = global.emailCodeCache || new Map();
global.emailCodeCache = emailCodeCache;

export async function POST(req) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json(
      { success: false, message: "이메일과 코드가 필요합니다." },
      { status: 400 }
    );
  }

  const saved = emailCodeCache.get(email);
  if (!saved) {
    return NextResponse.json(
      { success: false, message: "인증 코드가 존재하지 않습니다." },
      { status: 404 }
    );
  }

  const isExpired = Date.now() - saved.createdAt > 5 * 60 * 1000; // 5분 유효
  if (isExpired) {
    emailCodeCache.delete(email);
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

  // ✅ 인증 성공 후 캐시 삭제
  emailCodeCache.delete(email);

  return NextResponse.json({ success: true, message: "이메일 인증 성공" });
}
