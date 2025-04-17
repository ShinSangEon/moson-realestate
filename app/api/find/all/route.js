import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // 1. 쿠키에서 JWT 추출
    const cookie = req.headers.get("cookie");
    const token = cookie
      ?.split(";")
      ?.find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ message: "인증 토큰 없음" }, { status: 401 });
    }

    // 2. JWT 디코드
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. 관리자 권한 확인
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "권한 없음" }, { status: 403 });
    }

    // 4. 요청 데이터 조회
    const requests = await prisma.findRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("❌ 관리자 요청 불러오기 실패:", err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}
