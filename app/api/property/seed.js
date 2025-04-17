import prisma from "../../../lib/prisma";

const seedData = async () => {
  try {
    // 중개사 생성
    const agent = await prisma.agent.create({
      data: {
        name: "김부동",
        officeName: "부동산중개법인",
        profileImage:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a",
        propertyCount: 1,
      },
    });

    // 매물 생성
    const property = await prisma.property.create({
      data: {
        title: "스카이시티프라디움 전용 84.99m²",
        address: "서울특별시 서대문구 가좌동",
        type: "매매",
        price: 510000000,
        area: 84.99,
        pyung: 25.7,
        floor: 26,
        rooms: 3,
        bathrooms: 2,
        maintenanceFee: 190000,
        description:
          "스카이시티프라디움 전용 84.99m², 26층 전망 좋은 매물입니다. 주차 가능, 관리비 19만원, 실매물입니다.",
        images: [
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
        ],
        buildingNumber: "101동",
        totalFloors: 35,
        isVerified: true,
        isHidden: false,
        lastVerifiedAt: new Date(),
        agentId: agent.id,
      },
    });

    console.log("시드 데이터 생성 완료:", property);
  } catch (error) {
    console.error("시드 데이터 생성 오류:", error);
  }
};

seedData();
