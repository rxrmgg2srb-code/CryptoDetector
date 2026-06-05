import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  keywords?: string[];
  canonical?: string;
}

export default function SEOHead({
  title = 'DegenScore - Tu Trading Card de Solana',
  description = '¡Descubre tu nivel de degen! Genera tu trading card personalizada con tus métricas de Solana. Compite en el leaderboard, gana desafíos semanales y presume tu score.',
  image,
  type = 'website',
  author,
  keywords = [
    'solana',
    'trading',
    'defi',
    'degen',
    'crypto',
    'nft',
    'leaderboard',
    'analytics',
    'wallet',
    'blockchain',
  ],
  canonical,
}: SEOHeadProps) {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://degenscore.app';
  const currentUrl = canonical || `${baseUrl}${router.asPath}`;
  const ogImage = image || `${baseUrl}/og-default.png`;

  const fullTitle = title.includes('DegenScore') ? title : `${title} | DegenScore`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      {author && <meta name="author" content={author} />}

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="DegenScore" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:locale:alternate" content="zh_CN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@DegenScore" />
      <meta name="twitter:site" content="@DegenScore" />

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#9333ea" />
      <meta name="msapplication-TileColor" content="#9333ea" />

      {/* Favicons */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://api.mainnet-beta.solana.com" />
      <link rel="dns-prefetch" href="https://helius-rpc.com" />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'DegenScore',
            description:
              'Plataforma para generar trading cards personalizadas con métricas de trading en Solana',
            url: baseUrl,
            applicationCategory: 'FinanceApplication',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'SOL',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '1250',
            },
          }),
        }}
      />
    </Head>
  );
}
