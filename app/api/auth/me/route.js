// app/api/auth/me/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return NextResponse.json({
      userId: decoded.userId,
      email: decoded.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "인증에 실패했습니다." },
      { status: 403 }
    );
  }
}
