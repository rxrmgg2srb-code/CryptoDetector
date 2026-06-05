import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  environment: process.env.NODE_ENV,

  // Opciones específicas del servidor
  beforeSend(event, _hint) {
    // No enviar errores de desarrollo
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
