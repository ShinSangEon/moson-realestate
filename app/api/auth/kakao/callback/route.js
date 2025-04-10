import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const KAKAO_CLIENT_ID = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;

export async function GET(req) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=코드가 없습니다`);
  }

  try {
    // 1️⃣ 카카오 토큰 요청
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_CLIENT_ID,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const kakaoAccessToken = tokenData.access_token;

    if (!kakaoAccessToken) {
      return NextResponse.redirect(`${BASE_URL}/login?error=토큰 발급 실패`);
    }

    // 2️⃣ 사용자 정보 요청
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${kakaoAccessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const kakaoUser = await userRes.json();
    const kakaoEmail = kakaoUser.kakao_account?.email;
    const kakaoName = kakaoUser.kakao_account?.profile?.nickname;

    if (!kakaoEmail) {
      return NextResponse.redirect(
        `${BASE_URL}/login?error=이메일 정보를 가져올 수 없습니다`
      );
    }

    // 3️⃣ DB에 유저가 존재하면 로그인, 없으면 회원가입 후 로그인
    let user = await prisma.user.findUnique({ where: { email: kakaoEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: kakaoEmail,
          name: kakaoName || "카카오유저",
          password: "", // 카카오는 비밀번호가 없음
        },
      });
    }

    // 4️⃣ JWT 발급
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ 리디렉션과 쿠키 설정
    const response = NextResponse.redirect(`${BASE_URL}/`);
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("카카오 로그인 오류:", err);
    return NextResponse.redirect(`${BASE_URL}/login?error=소셜 로그인 실패`);
  }
}
