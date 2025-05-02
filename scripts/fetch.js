import dotenv from "dotenv";
dotenv.config();

import { fetchTransactions } from "../lib/fetchTransactions.js"; // ← 상대경로로 고쳐야 해!
import { insertTransactions } from "../lib/molit/insertTransactions.js";

const serviceKey = process.env.MOLIT_SERVICE_KEY;
const LAWD_CD = "48170"; // 진주시
const numOfMonths = 6; // 최근 6개월치 가져오기

function getFormattedYM(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}${month}`;
}

async function run() {
  const now = new Date();

  for (let i = 0; i < numOfMonths; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const DEAL_YMD = getFormattedYM(date);

    console.log(`📆 ${DEAL_YMD} 거래 불러오는 중...`);

    const items = await fetchTransactions({
      LAWD_CD,
      DEAL_YMD,
      serviceKey,
      numOfRows: 1000,
    });

    console.log(`📦 ${items.length}건 가져옴 → DB 저장 중...`);
    await insertTransactions(items);
    console.log(`✅ ${DEAL_YMD} 저장 완료`);
  }

  console.log("🎉 전체 작업 완료");
}

run();
