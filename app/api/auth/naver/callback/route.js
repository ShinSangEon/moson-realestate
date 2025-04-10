// app/api/auth/naver/callback/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=소셜 로그인 실패`
    );
  }

  try {
    // 1️⃣ 토큰 요청
    const tokenRes = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${process.env.NAVER_CLIENT_ID}&client_secret=${process.env.NAVER_CLIENT_SECRET}&code=${code}&state=${state}`,
      { method: "GET" }
    );
    const tokenData = await tokenRes.json();

    const accessToken = tokenData.access_token;
    if (!accessToken) throw new Error("토큰 요청 실패");

    // 2️⃣ 유저 정보 요청
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userData = await userRes.json();
    const profile = userData.response;

    const naverEmail = profile.email;
    const naverName = profile.name;

    if (!naverEmail) throw new Error("이메일 정보를 가져올 수 없습니다.");

    // 3️⃣ DB에 유저 저장 or 불러오기
    let user = await prisma.user.findUnique({ where: { email: naverEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: naverEmail,
          name: naverName || "네이버 사용자",
          password: "", // 소셜로그인 유저는 비워두기
        },
      });
    }

    // 4️⃣ JWT 발급 및 쿠키 설정
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/`
    );
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("네이버 로그인 오류:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/login?error=소셜 로그인 실패`
    );
  }
}
