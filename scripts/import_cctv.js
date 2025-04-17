import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function importCSV() {
  const results = [];

  fs.createReadStream("cctv.csv")
    .pipe(csv())
    .on("data", (row) => {
      results.push({
        address: row["소재지지번주소"] || "",
        purpose: row["설치목적구분"] || "",
        cameraCount: parseInt(row["카메라대수"], 10) || 0,
        resolution: row["카메라화소수"] || "",
        direction: row["촬영방면정보"] || "",
        storageDays: parseInt(row["보관일수"], 10) || 0,
        installationDate: new Date(row["설치연월"]),
        contactNumber: row["관리기관전화번호"] || "",
        latitude: parseFloat(row["WGS84위도"]) || 0,
        longitude: parseFloat(row["WGS84경도"]) || 0,
        dataUpdatedAt: new Date(row["데이터기준일자"]),
      });
    })
    .on("end", async () => {
      console.log(`✅ ${results.length}개 데이터 읽음, MySQL에 저장 중...`);
      
      try {
        await prisma.CCTV.createMany({
          data: results,
          skipDuplicates: true,
        });
        console.log("✅ 데이터 삽입 완료!");
      } catch (error) {
        console.error("❌ 데이터 삽입 중 오류 발생:", error);
      } finally {
        await prisma.$disconnect();
      }
    });
}

importCSV();
