import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { createClient } from "redis";

let prisma;
let redisClient;

if (process.env.NODE_ENV === 'production') {
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
      url: process.env.REDIS_URL
    });
    await redisClient.connect();
  }
  return redisClient;
};

const CACHE_KEY = "apartment_markers_data";
const CACHE_DURATION = 300; 

export async function GET() {
  try {
    const redis = await connectRedis();
    const cachedData = await redis.get(CACHE_KEY);
    
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData), { 
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300',
        }
      });
    }

    const apartmentMarkers = await prisma.Apartment_Marker.findMany();
    
    await redis.set(CACHE_KEY, JSON.stringify(apartmentMarkers), {
      EX: CACHE_DURATION
    });
    
    return NextResponse.json(apartmentMarkers, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300',
      }
    });
  } catch (error) {
    console.error('DB 조회 오류:', error);
    return NextResponse.json({ error: "데이터 조회 실패", details: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      complexUniqueId,
      latitude,
      longitude
    } = body;

    const newApartmentMarker = await prisma.Apartment_Marker.create({
      data: {
        complexUniqueId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    const redis = await connectRedis();
    await redis.del(CACHE_KEY);

    return NextResponse.json(newApartmentMarker, { status: 201 });
  } catch (error) {
    console.error('DB 추가 오류:', error);
    return NextResponse.json({ error: "데이터 추가 실패", details: error.message }, { status: 500 });
  }
}
