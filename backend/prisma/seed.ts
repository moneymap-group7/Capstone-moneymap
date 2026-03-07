import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.bankCategoryRule.createMany({
    data: [
      { bank: 'CIBC', matchText: 'OPENAI', spendCategory: 'FEES', priority: 1 },
      { bank: 'CIBC', matchText: 'CHATGPT', spendCategory: 'FEES', priority: 1 },

      { bank: 'CIBC', matchText: 'SQ *CHERRY', spendCategory: 'FOOD_AND_DINING', priority: 0 },
      { bank: 'CIBC', matchText: 'CHERRY', spendCategory: 'FOOD_AND_DINING', priority: 1 },
      { bank: 'CIBC', matchText: 'DESSERT', spendCategory: 'FOOD_AND_DINING', priority: 1 },

      { bank: 'CIBC', matchText: 'UBERTRIP', spendCategory: 'TRANSPORTATION', priority: 0 },
      { bank: 'CIBC', matchText: 'UBER', spendCategory: 'TRANSPORTATION', priority: 1 },

      { bank: 'CIBC', matchText: 'LSS-', spendCategory: 'OTHER', priority: 10 },
    ],
    skipDuplicates: true,
  });

  console.log(' Seeded bank_category_rules');
}

main()
  .catch((e) => {
    console.error(' Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
