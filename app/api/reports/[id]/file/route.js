import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
    });

    if (!report) {
      return NextResponse.json(
        { error: "보고서를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 실제로는 S3나 다른 스토리지 서비스에서 파일을 가져와야 함
    // 여기서는 예시로 로컬 파일을 사용
    const filePath = path.join(process.cwd(), "public", "reports", `${id}.pdf`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "PDF 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF 파일 제공 오류:", error);
    return NextResponse.json(
      { error: "PDF 파일을 제공할 수 없습니다." },
      { status: 500 }
    );
  }
}
