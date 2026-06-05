/**
 * Script para crear el challenge semanal
 * Ejecutar con: npx ts-node scripts/create-weekly-challenge.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Challenge único: Most Loved Card
const challengeTemplate = {
  title: '❤️ Most Loved Card',
  description:
    'Get the most likes on your card this week! Challenge activates when we reach 100 cards.',
  metric: 'likes',
  minCardsRequired: 100,
};

async function main() {
  try {
    const now = new Date();

    // Calculate week number
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

    console.log(`📅 Creating challenge for Week ${weekNumber} of ${now.getFullYear()}`);

    // Check total cards count
    const totalCards = await prisma.degenCard.count();
    console.log(`📊 Total cards generated: ${totalCards}`);

    if (totalCards < challengeTemplate.minCardsRequired) {
      console.log(
        `⏳ Waiting for ${challengeTemplate.minCardsRequired} cards to activate challenge`
      );
      console.log(`   Current: ${totalCards} cards`);
      console.log(`   Needed: ${challengeTemplate.minCardsRequired - totalCards} more cards`);
      return;
    }

    // Check if challenge already exists
    const existing = await prisma.weeklyChallenge.findUnique({
      where: { week: weekNumber },
    });

    if (existing) {
      console.log(`⚠️ Challenge for week ${weekNumber} already exists`);
      console.log(`   Title: ${existing.title}`);
      console.log(`   Prize: ${existing.prizeSOL} SOL`);
      return;
    }

    // Calculate start and end dates (Monday to Sunday)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - now.getDay() + 1); // Monday
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Sunday
    endDate.setHours(23, 59, 59, 999);

    // Create challenge
    const challenge = await prisma.weeklyChallenge.create({
      data: {
        week: weekNumber,
        year: now.getFullYear(),
        title: challengeTemplate.title,
        description: challengeTemplate.description,
        metric: challengeTemplate.metric,
        prizeSOL: 1.0,
        minCardsRequired: challengeTemplate.minCardsRequired,
        startDate,
        endDate,
        isActive: true,
      },
    });

    console.log('✅ Weekly challenge created successfully:');
    console.log(`   Title: ${challenge.title}`);
    console.log(`   Metric: ${challenge.metric}`);
    console.log(`   Prize: ${challenge.prizeSOL} SOL`);
    console.log(`   Start: ${challenge.startDate.toISOString()}`);
    console.log(`   End: ${challenge.endDate.toISOString()}`);
    console.log('');
    console.log("🎉 Premium users can now compete for this week's challenge!");
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
