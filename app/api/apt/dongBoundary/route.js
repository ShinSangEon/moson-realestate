import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dong = searchParams.get("dong");

    if (!dong) {
      return NextResponse.json(
        { error: "동 이름이 필요합니다." },
        { status: 400 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "public",
      "json",
      "jinju-dong.geojson"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "경계 데이터를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const geoData = JSON.parse(fileContent);

    // GeometryCollection 형식 처리
    if (geoData.type === "GeometryCollection") {
      const features = geoData.geometries.map((geometry) => ({
        type: "Feature",
        properties: {},
        geometry: geometry,
      }));

      return NextResponse.json({
        type: "FeatureCollection",
        features: features,
      });
    }

    // 기존 FeatureCollection 형식 처리
    if (geoData.type === "FeatureCollection") {
      return NextResponse.json(geoData);
    }

    return NextResponse.json(
      { error: "지원하지 않는 데이터 형식입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("경계 데이터 처리 중 오류:", error);
    return NextResponse.json(
      { error: "경계 데이터를 처리할 수 없습니다." },
      { status: 500 }
    );
  }
}
