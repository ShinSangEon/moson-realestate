import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function importApartmentMarkers() {
  const results = [];

  fs.createReadStream("./data/apartment_details_51.csv")
    .pipe(csv())
    .on("data", (row) => {
      let complexId = null;
      Object.keys(row).forEach((key) => {
        if (key.includes("단지고유번호") || key.trim() === "단지고유번호") {
          complexId = row[key];
        }
      });

      const data = {
        complexUniqueId: complexId
          ? complexId.toString().replace(/['"]+/g, "").trim()
          : "",
        latitude: parseFloat(row["위도"] || row["latitude"] || 0) || 0,
        longitude: parseFloat(row["경도"] || row["longitude"] || 0) || 0,
      };
      results.push(data);
    })
    .on("end", async () => {
      try {
        console.log(
          `총 ${results.length}개의 아파트 마커 데이터를 가져왔습니다.`
        );

        for (const marker of results) {
          await prisma.Apartment_Marker.create({
            data: marker,
          });
        }

        console.log("아파트 마커 데이터 DB 삽입 완료");
      } catch (error) {
        console.error("❌ 오류 발생:", error);
      } finally {
        await prisma.$disconnect();
      }
    });
}

importApartmentMarkers();
