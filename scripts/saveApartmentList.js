// scripts/saveApartmentList.js
import fetchApartmentList from "../lib/fetchApartmentList.js"; // ✅ default import
import prisma from "../lib/prisma.js";

const sidoCode = "48";
const pageNo = 1;
const numOfRows = 1000;

async function save() {
  const aptList = await fetchApartmentList(sidoCode, pageNo, numOfRows);

  for (const apt of aptList) {
    try {
      await prisma.apartmentBasic.upsert({
        where: { kaptCode: apt.kaptCode },
        update: {},
        create: {
          kaptCode: apt.kaptCode,
          kaptName: apt.kaptName,
          bjdCode: apt.bjdCode,
          as1: apt.as1,
          as2: apt.as2,
          as3: apt.as3,
          as4: apt.as4,
        },
      });

      console.log(`✅ 저장됨: ${apt.kaptName} (${apt.kaptCode})`);
    } catch (err) {
      console.error("❌ DB 저장 오류:", err.message);
    }
  }

  console.log("🏁 단지 목록 저장 완료");
}

save();
