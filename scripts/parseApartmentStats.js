// scripts/parseApartmentStats.js
import xlsx from "xlsx";
import fs from "fs";

const workbook = xlsx.readFile("data/진주시_2023~2025_전세매매_분석자료.xlsx");

// 단지별 평균 비교 시트를 선택
const sheet = workbook.Sheets["단지별 평균 비교"];
const data = xlsx.utils.sheet_to_json(sheet);

// 필요한 필드만 가공해서 정리
const parsed = data.map((row) => ({
  name: row["단지명"],
  avgSale: row["평균_매매가"],
  avgRent: row["평균_전세가"],
  rentRate: row["전세가율(%)"],
}));

// JSON 파일로 저장
fs.writeFileSync(
  "data/complexAvgData.json",
  JSON.stringify(parsed, null, 2),
  "utf-8"
);

console.log("✅ 단지 평균 데이터 저장 완료");
