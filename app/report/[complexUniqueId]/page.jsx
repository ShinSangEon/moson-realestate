import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import ReportPageClient from "./ReportPageClient";

const prisma = new PrismaClient();

export async function generateMetadata({ params }) {
  const complexUniqueId = decodeURIComponent(params.complexUniqueId);
  const apt = await prisma.apartment_Details.findUnique({
    where: { complexUniqueId },
  });

  return {
    title: `${apt?.complexNameBuilding || "아파트"} 분석 보고서 | 모손 부동산`,
    description: `${
      apt?.complexNameBuilding || "아파트"
    }의 상세 분석 보고서를 확인하세요.`,
  };
}

export default async function ReportPage({ params }) {
  const complexUniqueId = decodeURIComponent(params.complexUniqueId);

  const apt = await prisma.apartment_Details.findUnique({
    where: { complexUniqueId },
  });

  if (!apt) return notFound();

  return <ReportPageClient apt={apt} />;
}
