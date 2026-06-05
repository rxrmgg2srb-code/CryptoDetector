import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { logger } from '@/lib/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://degenscore.app';

    // Páginas estáticas
    const staticPages = [
      { url: '', priority: 1.0, changefreq: 'daily' },
      { url: '/leaderboard', priority: 0.9, changefreq: 'hourly' },
      { url: '/documentation', priority: 0.8, changefreq: 'weekly' },
      { url: '/about', priority: 0.6, changefreq: 'monthly' },
      { url: '/faq', priority: 0.7, changefreq: 'monthly' },
    ];

    // Obtener cards públicas (isPaid = true)
    const publicCards = await prisma.degenCard.findMany({
      where: { isPaid: true },
      select: { walletAddress: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 1000, // Limitar a 1000 cards más recientes
    });

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${publicCards
  .map(
    (card) => `  <url>
    <loc>${baseUrl}/card/${card.walletAddress}</loc>
    <lastmod>${card.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hora
    res.status(200).send(sitemap);
  } catch (error) {
    logger.error('Error generating sitemap:', error instanceof Error ? error : undefined, {
      error: String(error),
    });
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
