import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const geminiModels = await prisma.aIModel.findMany({
    where: {
      provider: {
        type: 'GEMINI',
      },
    },
  });

  for (const m of geminiModels) {
    if (m.modelId === 'gemini-1.5-pro') {
      await prisma.aIModel.update({
        where: { id: m.id },
        data: { modelId: 'gemini-1.5-flash' },
      });
      console.log(`Updated model ${m.name} (${m.id}) modelId to gemini-1.5-flash`);
    }
  }
}

main().finally(() => prisma.$disconnect());
