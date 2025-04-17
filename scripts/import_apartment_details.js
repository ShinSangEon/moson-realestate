// scripts/import_apartment_details.js (업데이트된 버전)

import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function importApartmentDetails() {
  const results = [];

  fs.createReadStream("./data/apartment_details.csv")
    .pipe(csv())
    .on("data", (row) => {
      const data = {
        address: (() => {
          for (const key of Object.keys(row)) {
            if (key.includes("주소") && !key.includes("단지명")) {
              return row[key] ? row[key].toString() : "";
            }
          }
          return "";
        })(),
        complexType: row["단지종류"]?.toString() || "",
        complexNamePublic: row["단지명_공시가격"]?.toString() || "",
        complexNameBuilding: row["단지명_건축물대장"]?.toString() || "",
        complexNameRoad: row["단지명_도로명주소"]?.toString() || "",
        complexUniqueId:
          row["단지고유번호"]?.toString().replace(/"/g, "") || "",
        buildingCount: parseInt(row["동수"] || 0),
        landUniqueId: row["필지고유번호"]?.toString().replace(/"/g, "") || "",
        householdCount: parseInt(row["세대수"] || 0),
        approvalDate: row["사용승인일"]
          ? new Date(
              row["사용승인일"].replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
            )
          : null,
        buildingName: row["동명_건축물대장"]?.toString() || "",
        floorCount: parseInt(row["지상층수"] || 0),
        latitude: parseFloat(row["위도"] || 0),
        longitude: parseFloat(row["경도"] || 0),
      };
      results.push(data);
    })
    .on("end", async () => {
      try {
        console.log(
          `📦 총 ${results.length}개의 아파트 상세 데이터를 가져왔습니다.`
        );

        for (const apt of results) {
          await prisma.apartment_Details.upsert({
            where: { complexUniqueId: apt.complexUniqueId },
            update: {},
            create: apt,
          });
        }

        console.log("✅ 아파트 상세 데이터 DB 삽입 완료!");
      } catch (error) {
        console.error("❌ 오류 발생:", error);
      } finally {
        await prisma.$disconnect();
      }
    });
}

importApartmentDetails();
