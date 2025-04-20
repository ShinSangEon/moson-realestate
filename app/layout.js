// app/layout.js
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/app/components/Navbar";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "모손부동산",
  description: "부동산 정보 플랫폼",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Toaster position="top-right" richColors closeButton />
        <Providers>
          <Navbar />
          <main className="pt-20 max-w-7xl mx-auto px-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
