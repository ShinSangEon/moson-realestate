"use client";

import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Map,
  Search,
  Upload,
  Users,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-green-100 text-gray-800 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* 소개 */}
        <div>
          <h2 className="text-xl font-bold mb-3">모손 공인중개사</h2>
          <p className="text-sm leading-relaxed">
            모르면 손해, 모손!
            <br />
            젊은 감각과 정확한 정보로 진주시 최고의 부동산 경험을 드립니다.
          </p>
        </div>

        {/* 링크 */}
        <div>
          <h3 className="text-lg font-semibold mb-3">빠른 메뉴</h3>
          <ul className="text-sm space-y-2">
            <FooterLink href="/map" icon={<Map size={16} />} label="지도" />
            <FooterLink
              href="/find"
              icon={<Search size={16} />}
              label="구해줘!"
            />
            <FooterLink
              href="/sell"
              icon={<Upload size={16} />}
              label="팔아줘!"
            />
            <FooterLink
              href="/community"
              icon={<Users size={16} />}
              label="지역 커뮤니티"
            />
          </ul>
        </div>

        {/* 연락처 + SNS */}
        <div>
          <h3 className="text-lg font-semibold mb-3">연락처</h3>
          <ul className="text-sm space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <MapPin size={16} /> 진주시 초전동 123-45
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} /> 010-1234-5678
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} /> contact@moson.kr
            </li>
          </ul>
          <div className="flex gap-4">
            <a
              href="https://youtube.com/yourchannel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-red-500 transition"
              title="YouTube"
            >
              <Youtube size={20} />
            </a>
            <a
              href="https://instagram.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-pink-500 transition"
              title="Instagram"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* 바닥줄 */}
      <div className="bg-green-200 text-center text-sm py-4">
        © {new Date().getFullYear()} 모손 부동산. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLink({ href, icon, label }) {
  return (
    <li>
      <a href={href} className="flex items-center gap-2 hover:underline">
        {icon}
        {label}
      </a>
    </li>
  );
}
