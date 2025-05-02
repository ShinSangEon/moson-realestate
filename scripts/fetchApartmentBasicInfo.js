import fs from "fs";
import axios from "axios";
import csv from "csv-parser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getCoordinatesFromAddress } from "../lib/kakao/geocoding.js";

dotenv.config();
const prisma = new PrismaClient();

const SERVICE_KEY = process.env.SERVICE_KEY;
const CSV_PATH = "./data/ApartmentBasic_202504231046.csv";
const API_BASE =
  "https://apis.data.go.kr/1613000/AptBasisInfoServiceV3/getAphusBassInfoV3";
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// 안전한 숫자 변환
const parseIntOrNull = (val) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? null : parsed;
};

const parseFloatOrNull = (val) => {
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

// 단지 기본 정보 + 좌표 추출 후 DB 저장
async function fetchBasicInfo(kaptCode) {
  try {
    const response = await axios.get(API_BASE, {
      params: {
        serviceKey: SERVICE_KEY,
        kaptCode,
        _type: "json",
      },
    });

    const item = response.data?.response?.body?.item;
    if (!item) {
      console.warn(`🚫 No data for kaptCode: ${kaptCode}`);
      return;
    }

    // 📍 좌표 변환 (도로명 주소가 있을 경우만)
    let coordinates = { lat: null, lng: null };
    if (item.doroJuso) {
      const geo = await getCoordinatesFromAddress(item.doroJuso);
      if (geo) coordinates = geo;
    }

    // 저장할 데이터 구성
    const baseData = {
      kaptCode,
      kaptName: item.kaptName,
      kaptAddr: item.kaptAddr,
      codeSaleNm: item.codeSaleNm,
      codeHeatNm: item.codeHeatNm,
      kaptTarea: parseFloatOrNull(item.kaptTarea),
      kaptDongCnt: parseIntOrNull(item.kaptDongCnt),
      kaptdaCnt: item.kaptdaCnt?.toString() ?? null,
      kaptBcompany: item.kaptBcompany,
      kaptAcompany: item.kaptAcompany,
      kaptTel: item.kaptTel,
      kaptFax: item.kaptFax,
      kaptUrl: item.kaptUrl,
      codeAptNm: item.codeAptNm,
      doroJuso: item.doroJuso,
      hoCnt: parseIntOrNull(item.hoCnt),
      codeMgrNm: item.codeMgrNm,
      codeHallNm: item.codeHallNm,
      kaptUsedate: item.kaptUsedate,
      kaptMarea: parseFloatOrNull(item.kaptMarea),
      kaptMparea60: parseFloatOrNull(item.kaptMparea60),
      kaptMparea85: parseFloatOrNull(item.kaptMparea85),
      kaptMparea135: parseFloatOrNull(item.kaptMparea135),
      kaptMparea136: parseFloatOrNull(item.kaptMparea136),
      privArea: parseFloatOrNull(item.privArea),
      bjdCode: item.bjdCode,
      kaptTopFloor: parseIntOrNull(item.kaptTopFloor),
      ktownFlrNo: parseIntOrNull(item.ktownFlrNo),
      kaptBaseFloor: parseIntOrNull(item.kaptBaseFloor),
      kaptdEcntp: parseIntOrNull(item.kaptdEcntp),
      zipcode: item.zipcode,
      lat: coordinates.lat,
      lng: coordinates.lng,
    };

    await prisma.apartmentBasicInfo.upsert({
      where: { kaptCode },
      update: baseData,
      create: baseData,
    });

    console.log(`✅ Saved: ${kaptCode}`);
  } catch (err) {
    console.error(`❌ Error for ${kaptCode}:`, err.message);
  }
}

// CSV로부터 kaptCode 리스트 추출 후 반복 처리
async function processCSV() {
  const kaptCodes = [];
  fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on("data", (row) => {
      if (row.kaptCode) kaptCodes.push(row.kaptCode);
    })
    .on("end", async () => {
      console.log("🚀 Start fetching...");
      for (const code of kaptCodes) {
        await fetchBasicInfo(code);
        await delay(300); // API 호출 간 간격 유지
      }
      console.log("🏁 Done!");
      await prisma.$disconnect();
    });
}

processCSV();
