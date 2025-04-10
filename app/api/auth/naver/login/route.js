// app/api/auth/naver/login/route.js
import { NextResponse } from "next/server";

export async function GET() {
  const state = "naver";
  const NAVER_AUTH_URL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}&redirect_uri=${process.env.NAVER_REDIRECT_URI}&state=${state}`;
  return NextResponse.redirect(NAVER_AUTH_URL);
}
