import { PrismaClient, SpendCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding is disabled in production.");
  }

  await prisma.bankCategoryRule.createMany({
    data: [
      { bank: "CIBC", matchText: "OPENAI", spendCategory: SpendCategory.FEES, priority: 1 },
      { bank: "CIBC", matchText: "CHATGPT", spendCategory: SpendCategory.FEES, priority: 1 },

      { bank: "CIBC", matchText: "SQ *CHERRY", spendCategory: SpendCategory.FOOD_AND_DINING, priority: 0 },
      { bank: "CIBC", matchText: "CHERRY", spendCategory: SpendCategory.FOOD_AND_DINING, priority: 1 },
      { bank: "CIBC", matchText: "DESSERT", spendCategory: SpendCategory.FOOD_AND_DINING, priority: 1 },

      { bank: "CIBC", matchText: "UBERTRIP", spendCategory: SpendCategory.TRANSPORTATION, priority: 0 },
      { bank: "CIBC", matchText: "UBER", spendCategory: SpendCategory.TRANSPORTATION, priority: 1 },

      { bank: "CIBC", matchText: "LSS-", spendCategory: SpendCategory.OTHER, priority: 10 },
    ],
    skipDuplicates: true,
  });

console.info("Seeded bank_category_rules");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
