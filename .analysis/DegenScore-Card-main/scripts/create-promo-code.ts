/**
 * Script para crear el código promocional DEGENLAUNCH2024
 * Ejecutar con: npx ts-node scripts/create-promo-code.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🎟️ Creating promo code...');

    const promoCode = await prisma.promoCode.upsert({
      where: { code: 'DEGENLAUNCH2024' },
      update: {
        isActive: true,
        description: 'Launch Promotion - Free Premium Upgrade',
      },
      create: {
        code: 'DEGENLAUNCH2024',
        description: 'Launch Promotion - Free Premium Upgrade',
        maxUses: 100, // Limitar a 100 usos para la promoción inicial
        usedCount: 0,
        isActive: true,
        expiresAt: null, // Sin fecha de expiración por ahora
      },
    });

    console.log('✅ Promo code created successfully:');
    console.log('   Code:', promoCode.code);
    console.log('   Description:', promoCode.description);
    console.log('   Max Uses:', promoCode.maxUses);
    console.log('   Currently Used:', promoCode.usedCount);
    console.log('   Is Active:', promoCode.isActive);
    console.log('   Expires At:', promoCode.expiresAt || 'Never');
    console.log('');
    console.log('🎉 Users can now use code "DEGENLAUNCH2024" to get free premium access!');
  } catch (error) {
    console.error('❌ Error creating promo code:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
