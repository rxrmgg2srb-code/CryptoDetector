import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay (gratis hasta 50 sesiones/mes)
  replaysSessionSampleRate: 0.01, // 1% de sesiones
  replaysOnErrorSampleRate: 1.0, // 100% cuando hay error

  environment: process.env.NODE_ENV,

  // Filtrar errores conocidos/no importantes
  beforeSend(event, hint) {
    // Ignorar errores de extensiones del navegador
    const error = hint.originalException;
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      if (
        error.message.includes('Extension') ||
        error.message.includes('chrome-extension') ||
        error.message.includes('moz-extension')
      ) {
        return null;
      }
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
