// app/apt/[complexUniqueId]/page.jsx
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import AptDetailPageClient from "./AptDetailPageClient";

// ✅ 전역 Prisma 인스턴스 재사용 권장
const prisma = new PrismaClient();

// ✅ 동적으로 metadata에서 DB 조회하지 않고, 기본 메타데이터만 설정
export function generateMetadata() {
  return {
    title: "아파트 상세 정보 | 모손 부동산",
    description: "진주 지역 아파트의 상세 정보를 확인하세요.",
  };
}

// ✅ 메인 페이지 함수
export default async function AptPage(context) {
  const complexUniqueId = decodeURIComponent(
    context.params?.complexUniqueId || ""
  );

  const apt = await prisma.apartment_Details.findUnique({
    where: { complexUniqueId },
  });

  if (!apt) return notFound();

  return <AptDetailPageClient apt={apt} />;
}
