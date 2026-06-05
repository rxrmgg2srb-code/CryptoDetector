#!/usr/bin/env ts-node

/**
 * Script para actualizar el premio de challenges existentes de 3 SOL a 1 SOL
 *
 * Uso:
 *   ts-node scripts/update-challenge-prize.ts
 *
 * O desde un API endpoint:
 *   GET /api/admin/update-challenges
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateChallengePrize() {
  try {
    console.log('🔄 Updating weekly challenge prizes...');

    // Actualizar todos los challenges que tengan 3.0 SOL a 1.0 SOL
    const result = await prisma.weeklyChallenge.updateMany({
      where: {
        prizeSOL: 3.0,
      },
      data: {
        prizeSOL: 1.0,
        minCardsRequired: 100, // También agregar el requisito mínimo
      },
    });

    console.log(`✅ Updated ${result.count} challenge(s)`);

    // Mostrar todos los challenges actualizados
    const challenges = await prisma.weeklyChallenge.findMany({
      orderBy: {
        startDate: 'desc',
      },
      take: 5,
    });

    console.log('\n📊 Recent challenges:');
    challenges.forEach((challenge) => {
      console.log(
        `  - Week ${challenge.week}/${challenge.year}: ${challenge.prizeSOL} SOL (min ${challenge.minCardsRequired} cards)`
      );
    });

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error updating challenges:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  updateChallengePrize()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { updateChallengePrize };
