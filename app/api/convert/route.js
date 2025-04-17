import { NextResponse } from "next/server";
import * as shapefile from "shapefile";
import * as proj4 from "proj4";
import fs from "fs";
import path from "path";

// 한국 TM 좌표계 정의
proj4.defs(
  "EPSG:5186",
  "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs"
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    // FormData 처리
    const formData = await request.formData();
    const shpFile = formData.get("shp");
    const dbfFile = formData.get("dbf");

    if (!shpFile || !dbfFile) {
      return NextResponse.json(
        { error: "SHP 파일과 DBF 파일이 모두 필요합니다." },
        { status: 400 }
      );
    }

    // 임시 디렉토리 생성
    const tempDir = path.join(process.cwd(), "public", "temp");
    fs.mkdirSync(tempDir, { recursive: true });

    // 파일 저장
    const shpPath = path.join(tempDir, "temp.shp");
    const dbfPath = path.join(tempDir, "temp.dbf");

    try {
      const shpBuffer = Buffer.from(await shpFile.arrayBuffer());
      const dbfBuffer = Buffer.from(await dbfFile.arrayBuffer());

      fs.writeFileSync(shpPath, shpBuffer);
      fs.writeFileSync(dbfPath, dbfBuffer);
    } catch (error) {
      console.error("파일 저장 오류:", error);
      return NextResponse.json(
        { error: "파일 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // SHP 파일 읽기
    let source;
    try {
      source = await shapefile.open(shpPath, dbfPath);
    } catch (error) {
      console.error("SHP 파일 읽기 오류:", error);
      fs.unlinkSync(shpPath);
      fs.unlinkSync(dbfPath);
      return NextResponse.json(
        { error: "SHP 파일을 읽을 수 없습니다." },
        { status: 500 }
      );
    }

    const features = [];

    // GeoJSON 생성
    try {
      while (true) {
        const result = await source.read();
        if (result.done) break;

        if (result.value.geometry) {
          // 좌표계 변환
          const geometry = result.value.geometry;
          if (geometry.type === "Polygon") {
            const transformedCoordinates = geometry.coordinates.map((ring) =>
              ring.map((point) => {
                const [x, y] = proj4("EPSG:5186", "EPSG:4326", point);
                return [x, y];
              })
            );

            features.push({
              type: "Feature",
              properties: result.value.properties,
              geometry: {
                type: "Polygon",
                coordinates: transformedCoordinates,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("GeoJSON 변환 오류:", error);
      fs.unlinkSync(shpPath);
      fs.unlinkSync(dbfPath);
      return NextResponse.json(
        { error: "GeoJSON 변환 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // GeoJSON 파일 저장
    try {
      const outputDir = path.join(process.cwd(), "public", "json");
      fs.mkdirSync(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, "jinju-dong.geojson");
      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          {
            type: "FeatureCollection",
            features: features,
          },
          null,
          2
        )
      );
    } catch (error) {
      console.error("파일 저장 오류:", error);
      return NextResponse.json(
        { error: "GeoJSON 파일 저장 중 오류가 발생했습니다." },
        { status: 500 }
      );
    } finally {
      // 임시 파일 삭제
      try {
        fs.unlinkSync(shpPath);
        fs.unlinkSync(dbfPath);
      } catch (error) {
        console.error("임시 파일 삭제 오류:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("전체 오류:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
