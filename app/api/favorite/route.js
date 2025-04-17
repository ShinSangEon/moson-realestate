import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const complexUniqueId = searchParams.get("complexUniqueId");
  const userId = await getAuthUserId();

  if (!userId || !complexUniqueId) {
    return NextResponse.json({ isFavorite: false });
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_complexUniqueId: {
        userId,
        complexUniqueId,
      },
    },
  });

  return NextResponse.json({ isFavorite: !!favorite });
}

export async function POST(req) {
  const userId = await getAuthUserId();
  const { complexUniqueId } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  if (!complexUniqueId) {
    return NextResponse.json(
      { error: "단지 고유번호가 누락되었습니다." },
      { status: 400 }
    );
  }

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_complexUniqueId: {
        userId,
        complexUniqueId,
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
        complexUniqueId,
      },
    });
    return NextResponse.json({ isFavorite: true });
  }
}
