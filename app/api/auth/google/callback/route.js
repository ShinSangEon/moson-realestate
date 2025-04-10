import { NextResponse } from 'next/server';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000/api/auth/google/callback';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: 'authorization_code',
  });

  const { access_token } = tokenRes.data;

  const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const { sub, name, email, picture } = userInfoRes.data;

  // 여기에 DB 저장 로직 필요 (User 모델 이용)
  // 예시: const user = await saveOrFindUser({ sub, name, email, picture });

  // JWT 발급
  const token = jwt.sign(
    { id: sub, name, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  cookies().set('token', token, {
    httpOnly: true,
    path: '/',
  });

  return NextResponse.redirect('http://localhost:3000/mypage');
}
