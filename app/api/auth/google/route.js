import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const client_id = process.env.GOOGLE_CLIENT_ID;
const redirect_uri = 'http://localhost:3000/api/auth/google/callback';
const scope = 'openid email profile';

export async function GET() {
  const state = Math.random().toString(36).substring(2); // 보안용
  const authorizationUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope}&state=${state}&access_type=offline`;

  return NextResponse.redirect(authorizationUrl);
}
