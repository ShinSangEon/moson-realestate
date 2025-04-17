import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export function getAuthUserId() {
  const cookieStore = cookies(); // ✅ 서버에서 사용
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId; // ✅ 여기에 정확히 userId로
  } catch (e) {
    console.error("JWT verify error:", e);
    return null;
  }
}
