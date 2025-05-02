import cron from "node-cron";
import { fetchTransactions } from "../lib/fetchTransactions.js";
import { insertTransactions } from "../lib/insertTransactions.js";
import dotenv from "dotenv";
dotenv.config();

const LAWD_CD = "48170"; // 진주시
const DEAL_YMD = "202503"; // 2025년 3월

cron.schedule("0 */10 * * *", async () => {
  console.log("🔁 [크론] 실거래가 데이터 수집 시작");
  const items = await fetchTransactions({
    LAWD_CD,
    DEAL_YMD,
    serviceKey: process.env.MOLIT_SERVICE_KEY,
  });
  await insertTransactions(items);
  console.log("✅ [크론] 실거래가 데이터 수집 완료");
});
