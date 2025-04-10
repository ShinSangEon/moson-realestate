// app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";
export const metadata = {
  title: "모손 부동산",
  description: "청년을 위한 진짜 실거래 기반 부동산 플랫폼",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Toaster richColors position="top-center" /> {/* ✅ 여기 추가 */}
        <Providers>
          <Navbar />
          <main className="pt-20 max-w-7xl mx-auto px-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
