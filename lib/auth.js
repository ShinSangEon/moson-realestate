import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function getAuthUserId() {
  // ✅ cookies() 자체를 반드시 await 해야 함!
  const cookieStore = await cookies(); // 🔥 핵심
  const tokenCookie = cookieStore.get("token");

  // 여기를 분리해서 확인하고 처리해야 오류 안 남
  if (!tokenCookie) return null;

  const token = tokenCookie.value;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.userId || payload.id;
  } catch {
    return null;
  }
}
