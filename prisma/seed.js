const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const badges = [
    {
      badgeId: "first-answer",
      name: "첫 답변",
      description: "첫 답변을 작성하세요",
      imageUrl: "/badges/first-answer.svg",
    },
    {
      badgeId: "expert-answerer",
      name: "전문 답변가",
      description: "답변 10개 이상 작성",
      imageUrl: "/badges/expert-answerer.svg",
    },
    {
      badgeId: "master-answerer",
      name: "답변 마스터",
      description: "답변 30개 이상 작성",
      imageUrl: "/badges/master-answerer.svg",
    },
    {
      badgeId: "first-post",
      name: "첫 게시글",
      description: "첫 게시글을 작성하세요",
      imageUrl: "/badges/first-post.svg",
    },
    {
      badgeId: "popular",
      name: "인기 작성자",
      description: "좋아요 10개 이상 받기",
      imageUrl: "/badges/popular.svg",
    },
    {
      badgeId: "answer-king",
      name: "답변왕",
      description: "답변 5개 이상 작성",
      imageUrl: "/badges/answer-king.svg",
    },
    {
      badgeId: "accepted-king",
      name: "채택왕",
      description: "답변 3개 이상 채택",
      imageUrl: "/badges/accepted-king.svg",
    },
    {
      badgeId: "community-star",
      name: "커뮤니티 스타",
      description: "좋아요 50개 이상 받기",
      imageUrl: "/badges/community-star.svg",
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { badgeId: badge.badgeId },
      update: badge,
      create: badge,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
