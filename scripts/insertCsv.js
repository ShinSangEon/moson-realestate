import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import prisma from "../lib/prisma.js";

const saleCsv = "./data/apartment_sales.csv";
const jeonseCsv = "./data/apartment_jeonse.csv";

// 🔁 매칭 안 된 데이터 저장용
function getUnmatchedWriter(type) {
  const isSale = type === "sales";

  return createObjectCsvWriter({
    path: `./data/unmatched_${type}.csv`,
    header: [
      { id: "단지명", title: "단지명" },
      { id: "계약일자", title: "계약일자" },
      isSale
        ? { id: "거래금액", title: "거래금액" }
        : { id: "보증금액", title: "보증금액" },
      { id: "전용면적", title: "전용면적" },
      { id: "층", title: "층" },
      { id: "건축년도", title: "건축년도" },
      isSale
        ? { id: "도로명", title: "도로명" }
        : { id: "주소", title: "주소" },
    ],
  });
}

async function insertTransactions(csvFile, type) {
  const rows = [];
  const unmatched = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          for (const row of rows) {
            const address = row["도로명"]?.trim() || row["주소"]?.trim();
            if (!address) {
              unmatched.push(row);
              continue;
            }

            const apt = await prisma.apartmentBasicInfo.findFirst({
              where:
                type === "매매"
                  ? { doroJuso: { contains: address } }
                  : { kaptAddr: { contains: address } },
            });

            if (!apt) {
              const cleaned = Object.fromEntries(
                Object.entries({
                  단지명: row["단지명"],
                  계약일자: row["계약일자"],
                  거래금액: row["거래금액"],
                  보증금액: row["보증금액"],
                  전용면적: row["전용면적"],
                  층: row["층"],
                  건축년도: row["건축년도"],
                  도로명: row["도로명"],
                  주소: row["주소"],
                }).filter(([_, value]) => value !== undefined)
              );
              unmatched.push(cleaned);
              console.warn(`⚠️ 주소 매칭 실패: ${address} (${row["단지명"]})`);
              continue;
            }

            const dealDate = new Date(row["계약일자"]);
            const floor = Number(row["층"]) || 0;
            const area = Number(row["전용면적"]) || 0;
            const buildYear = row["건축년도"] ? Number(row["건축년도"]) : null;

            const dealType = type; // "매매" or "전세"

            const saleAmount =
              dealType === "매매" ? Number(row["거래금액"]) || 0 : null;
            const depositAmount =
              dealType === "전세" ? Number(row["보증금액"]) || 0 : null;

            await prisma.apartmentTransaction.upsert({
              where: {
                kaptCode_dealYear_dealMonth_dealDay_floor_dealType: {
                  kaptCode: apt.kaptCode,
                  dealYear: dealDate.getFullYear(),
                  dealMonth: dealDate.getMonth() + 1,
                  dealDay: dealDate.getDate(),
                  floor: floor,
                  dealType: dealType,
                },
              },
              update: {
                dealType,
                saleAmount,
                depositAmount,
                monthlyAmount: null,
                area,
                buildYear,
                aptNm: row["단지명"],
                jibun: row["주소"],
              },
              create: {
                kaptCode: apt.kaptCode,
                dealType,
                saleAmount,
                depositAmount,
                monthlyAmount: null,
                area,
                dealYear: dealDate.getFullYear(),
                dealMonth: dealDate.getMonth() + 1,
                dealDay: dealDate.getDate(),
                floor,
                buildYear,
                aptNm: row["단지명"],
                jibun: row["주소"],
              },
            });
          }

          if (unmatched.length > 0) {
            const writer = getUnmatchedWriter(
              type === "매매" ? "sales" : "jeonse"
            );
            await writer.writeRecords(unmatched);
            console.log(
              `⚠️ 매칭 실패 ${unmatched.length}건 → unmatched_${
                type === "매매" ? "sales" : "jeonse"
              }.csv`
            );
          }

          console.log(`✅ ${type} 데이터 DB 저장 완료!`);
          resolve(unmatched.length);
        } catch (error) {
          console.error(`❌ ${type} 데이터 저장 중 에러 발생:`, error);
          reject(error);
        } finally {
          await prisma.$disconnect();
        }
      });
  });
}

// 🔁 실행
(async () => {
  try {
    const unmatchedSales = await insertTransactions(saleCsv, "매매");
    const unmatchedJeonse = await insertTransactions(jeonseCsv, "전세");

    console.log("🎯 매칭 요약:");
    console.log(`  🏢 매매 → 매칭 실패: ${unmatchedSales}건`);
    console.log(`  🏠 전세 → 매칭 실패: ${unmatchedJeonse}건`);
    console.log("🎉 모든 데이터 입력 완료!");
  } catch (err) {
    console.error("전체 작업 중 에러 발생:", err);
  }
})();
