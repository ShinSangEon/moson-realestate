import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const cookie = req.headers.get("cookie");
    const token = cookie
      ?.split(";")
      ?.find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token)
      return NextResponse.json({ message: "인증 없음" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return NextResponse.json({ message: "관리자 전용" }, { status: 403 });
    }

    const requests = await prisma.sellRequest.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("❌ 팔아줘 요청 불러오기 실패:", err);
    return NextResponse.json({ message: "서버 오류" }, { status: 500 });
  }
}
