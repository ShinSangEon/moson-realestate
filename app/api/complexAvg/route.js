import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 주소에서 행정동 이름을 추출하는 함수
function extractDongFromAddress(address) {
  try {
    // 주소에서 읍/면/동 추출
    const match = address.match(/([가-힣]+(동|읍|면))/);
    if (match) {
      return match[1];
    }

    // 읍/면/동이 없는 경우 (예: "경상남도 진주시" -> "진주시")
    const siMatch = address.match(/([가-힣]+시)/);
    if (siMatch) {
      return siMatch[1];
    }

    return null;
  } catch (error) {
    console.error("행정동 추출 중 오류:", error);
    return null;
  }
}

export async function GET() {
  console.log("1. API 호출 시작");
  try {
    // 1. 모든 아파트 단지 정보 조회
    console.log("2. 아파트 단지 정보 조회 시작");
    const complexes = await prisma.apartmentBasicInfo.findMany({
      select: {
        kaptCode: true,
        kaptName: true,
        kaptAddr: true,
      },
    });
    console.log(`3. 조회된 아파트 단지 수: ${complexes.length}`);

    // 2. 각 아파트 단지의 최신 거래 데이터 조회
    console.log("4. 거래 데이터 조회 시작");
    const transactions = await prisma.apartmentTransaction.findMany({
      where: {
        kaptCode: { in: complexes.map((c) => c.kaptCode) },
        dealType: { in: ["매매", "전세"] },
      },
      orderBy: {
        dealDay: "desc",
      },
      select: {
        kaptCode: true,
        dealType: true,
        saleAmount: true,
        depositAmount: true,
      },
    });
    console.log(`5. 조회된 거래 데이터 수: ${transactions.length}`);

    // 3. 행정동별 데이터 초기화
    console.log("6. 행정동별 데이터 그룹화 시작");
    const dongData = {};

    // 4. 각 아파트 단지의 데이터를 행정동별로 그룹화
    complexes.forEach((complex) => {
      const dong = extractDongFromAddress(complex.kaptAddr);
      if (!dong) {
        console.log(`⚠️ 주소에서 행정동을 추출할 수 없음: ${complex.kaptAddr}`);
        return;
      }

      if (!dongData[dong]) {
        dongData[dong] = {
          name: dong,
          totalSale: 0,
          totalRent: 0,
          saleCount: 0,
          rentCount: 0,
          complexCount: 0,
        };
      }

      // 해당 단지의 최신 거래 데이터 찾기
      const complexTransactions = transactions.filter(
        (t) => t.kaptCode === complex.kaptCode
      );

      // 매매 데이터 계산
      const saleTransaction = complexTransactions.find(
        (t) => t.dealType === "매매"
      );
      if (saleTransaction && saleTransaction.saleAmount) {
        dongData[dong].totalSale += saleTransaction.saleAmount;
        dongData[dong].saleCount++;
      }

      // 전세 데이터 계산
      const rentTransaction = complexTransactions.find(
        (t) => t.dealType === "전세"
      );
      if (rentTransaction && rentTransaction.depositAmount) {
        dongData[dong].totalRent += rentTransaction.depositAmount;
        dongData[dong].rentCount++;
      }

      dongData[dong].complexCount++;
    });

    // 5. 평균값 계산 및 결과 생성
    console.log("7. 평균값 계산 시작");
    const result = Object.values(dongData).map((dong) => ({
      name: dong.name,
      avgSale:
        dong.saleCount > 0 ? Math.round(dong.totalSale / dong.saleCount) : null,
      avgRent:
        dong.rentCount > 0 ? Math.round(dong.totalRent / dong.rentCount) : null,
      rentRate:
        dong.saleCount > 0 && dong.rentCount > 0
          ? Math.round(
              (dong.totalRent /
                dong.rentCount /
                (dong.totalSale / dong.saleCount)) *
                100
            )
          : null,
      complexCount: dong.complexCount,
    }));

    console.log("8. 최종 결과:", result);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("평균 데이터 로드 중 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "평균 데이터를 로드하는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
