import type { NextApiRequest, NextApiResponse } from 'next';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { logger } from '@/lib/logger';
import path from 'path';

// Registrar fonts para Vercel
try {
  const fontPath = path.join(process.cwd(), 'public', 'fonts');
  GlobalFonts.registerFromPath(path.join(fontPath, 'NotoSans-Regular.ttf'), 'Noto Sans');
  GlobalFonts.registerFromPath(path.join(fontPath, 'NotoSans-Bold.ttf'), 'Noto Sans Bold');
} catch (error) {
  logger.warn('⚠️ Fonts not available for test card');
}

/**
 * Endpoint de prueba para verificar que canvas funciona correctamente
 * Genera una tarjeta simple de prueba
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    logger.info('🧪 Generating TEST card...');

    const width = 600;
    const height = 950;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fondo oscuro
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Borde
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Título
    ctx.fillStyle = '#00d4ff';
    ctx.font = '700 44px "Noto Sans Bold", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TEST CARD', width / 2, 100);

    // Score grande
    ctx.fillStyle = '#ff4444';
    ctx.font = '700 110px "Noto Sans Bold", sans-serif';
    ctx.fillText('42', width / 2, 250);

    // Label
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '700 20px "Noto Sans Bold", sans-serif';
    ctx.fillText('TEST SCORE', width / 2, 320);

    // Métricas de prueba
    const y = 400;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#999999';
    ctx.font = '700 13px "Noto Sans Bold", sans-serif';
    ctx.fillText('TOTAL TRADES', 140, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px "Noto Sans Bold", sans-serif';
    ctx.fillText('123', 140, y + 32);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#999999';
    ctx.font = '700 13px "Noto Sans Bold", sans-serif';
    ctx.fillText('WIN RATE', width - 140, y);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px "Noto Sans Bold", sans-serif';
    ctx.fillText('75.5%', width - 140, y + 32);

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#777777';
    ctx.font = '400 15px "Noto Sans", sans-serif';
    ctx.fillText('TEST - Canvas Working with Fonts!', width / 2, height - 50);

    const buffer = canvas.toBuffer('image/png');

    logger.info('✅ TEST card generated:', { bufferSize: buffer.length });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(buffer);
  } catch (error) {
    logger.error('❌ Error in test-card:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({
      error: 'Failed to generate test card',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
