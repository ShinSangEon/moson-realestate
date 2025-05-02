import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const kaptCode = searchParams.get("kaptCode");
  const userId = await getAuthUserId();

  if (!userId || !kaptCode) {
    return NextResponse.json({ isFavorite: false });
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_kaptCode: {
        userId,
        kaptCode,
      },
    },
  });

  return NextResponse.json({ isFavorite: !!favorite });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  const { kaptCode } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  if (!kaptCode) {
    return NextResponse.json(
      { error: "단지 코드가 누락되었습니다." },
      { status: 400 }
    );
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_kaptCode: {
        userId,
        kaptCode,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFavorite: false });
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        kaptCode,
      },
    });
    return NextResponse.json({ isFavorite: true });
  }
}
