import { Suspense } from "react";
import AptDetailPageClient from "./AptDetailPageClient";
import { getAptDetail } from "@/lib/api/apt";

export async function generateMetadata({ params }) {
  const { kaptCode } = await params;
  const data = await getAptDetail(kaptCode);

  return {
    title: data?.data?.basicInfo?.kaptName || "아파트 상세 정보",
    description: data?.data?.basicInfo?.kaptAddr || "아파트 상세 정보 페이지",
  };
}

export default async function AptDetailPage({ params }) {
  const { kaptCode } = await params;
  const initialData = await getAptDetail(kaptCode);

  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <AptDetailPageClient initialData={initialData} />
    </Suspense>
  );
}
