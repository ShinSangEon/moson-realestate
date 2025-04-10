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

const CACHE_KEY = "cctvs_data";
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

    const cctvs = await prisma.CCTV.findMany();

    await redis.set(CACHE_KEY, JSON.stringify(cctvs), {
      EX: CACHE_DURATION,
    });

    return NextResponse.json(cctvs, {
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

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      address,
      purpose,
      cameraCount,
      resolution,
      direction,
      storageDays,
      installationDate,
      contactNumber,
      latitude,
      longitude,
      dataUpdatedAt,
    } = body;

    const newCCTV = await prisma.CCTV.create({
      data: {
        address,
        purpose,
        cameraCount: parseInt(cameraCount, 10),
        resolution,
        direction,
        storageDays: parseInt(storageDays, 10),
        installationDate: new Date(installationDate),
        contactNumber,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        dataUpdatedAt: new Date(dataUpdatedAt),
      },
    });

    const redis = await connectRedis();
    await redis.del(CACHE_KEY);

    return NextResponse.json(newCCTV, { status: 201 });
  } catch (error) {
    console.error("DB 추가 오류:", error);
    return NextResponse.json(
      { error: "데이터 추가 실패", details: error.message },
      { status: 500 }
    );
  }
}
