import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { createClient } from "redis";

let prisma;
let redisClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

const connectRedis = async () => {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    await redisClient.connect();
  }
  return redisClient;
};

const CACHE_KEY = "dong_data";
const CACHE_DURATION = 300;

export async function GET() {
  try {
    const redis = await connectRedis();
    const cachedData = await redis.get(CACHE_KEY);

    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData), {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // Apartment_Details에서 주소 정보 가져오기
    const apartmentDetails = await prisma.Apartment_Details.findMany({
      select: {
        address: true,
        complexUniqueId: true,
      },
    });

    // Apartment_Marker에서 좌표 정보 가져오기
    const apartmentMarkers = await prisma.Apartment_Marker.findMany({
      select: {
        complexUniqueId: true,
        latitude: true,
        longitude: true,
      },
    });

    // 주소와 좌표 정보를 complexUniqueId로 매칭
    const apartmentData = apartmentDetails.map((detail) => {
      const marker = apartmentMarkers.find(
        (m) => m.complexUniqueId === detail.complexUniqueId
      );
      return {
        ...detail,
        ...marker,
      };
    });

    // 주소에서 동을 추출하고 그룹화
    const dongGroups = apartmentData.reduce((acc, apt) => {
      if (!apt.address) return acc;

      const dongMatch = apt.address.match(/([가-힣]+동)/);
      if (!dongMatch) return acc;

      const dong = dongMatch[1];
      if (!acc[dong]) {
        acc[dong] = {
          count: 0,
          latitude: apt.latitude,
          longitude: apt.longitude,
        };
      }
      acc[dong].count++;

      return acc;
    }, {});

    // 클라이언트에 전달할 형식으로 변환
    const dongData = Object.entries(dongGroups).map(([dongName, data]) => ({
      dongName,
      latitude: data.latitude,
      longitude: data.longitude,
      apartmentCount: data.count,
    }));

    await redis.set(CACHE_KEY, JSON.stringify(dongData), {
      EX: CACHE_DURATION,
    });

    return NextResponse.json(dongData, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("DB 조회 오류:", error);
    return NextResponse.json(
      { error: "데이터 조회 실패", details: error.message },
      { status: 500 }
    );
  }
}
