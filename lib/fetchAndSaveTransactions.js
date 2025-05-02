// lib/fetchAndSaveTransactions.js
import { fetchTransactions } from "./fetchTransactions.js";
import prisma from "./prisma.js";
import dotenv from "dotenv";

dotenv.config();

const serviceKey = process.env.MOLIT_SERVICE_KEY;
const LAWD_CD = "48170"; // 진주 지역 코드
const DEAL_YMD_LIST = ["202403"]; // 원하는 조회 월
const ROWS_PER_PAGE = 1000;

const saveTransactionsToDB = async (transactions) => {
  for (const tx of transactions) {
    try {
      await prisma.apartmentTransaction.upsert({
        where: {
          kaptCode_dealYear_dealMonth_dealDay_floor: {
            kaptCode: tx.sggCd + "00000", // kaptCode 추정 생성
            dealYear: tx.dealYear,
            dealMonth: tx.dealMonth,
            dealDay: tx.dealDay,
            floor: tx.floor,
          },
        },
        update: tx,
        create: {
          kaptCode: tx.sggCd + "00000", // kaptCode 추정

          ...tx,
        },
      });
      console.log(
        `💾 저장됨: ${tx.aptNm || "미지정"} (${tx.dealYear}-${tx.dealMonth}-${
          tx.dealDay
        }) - ${tx.dealAmount.toLocaleString()}원, ${tx.area}㎡`
      );
    } catch (err) {
      console.error("❌ DB 저장 실패:", err.message);
    }
  }
};

const run = async () => {
  for (const yyyymm of DEAL_YMD_LIST) {
    let page = 1;
    while (true) {
      const transactions = await fetchTransactions({
        LAWD_CD,
        DEAL_YMD: yyyymm,
        pageNo: page,
        numOfRows: ROWS_PER_PAGE,
        serviceKey,
      });

      if (!transactions.length) break;

      await saveTransactionsToDB(transactions);
      page++;
    }
  }
  console.log("🏁 전체 저장 완료");
};

run();
