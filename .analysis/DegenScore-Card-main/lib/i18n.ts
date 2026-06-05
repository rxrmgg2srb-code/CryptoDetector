import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationES from '../locales/es/common.json';
import translationEN from '../locales/en/common.json';
import translationZH from '../locales/zh/common.json';

const resources = {
  es: {
    translation: translationES,
  },
  en: {
    translation: translationEN,
  },
  zh: {
    translation: translationZH,
  },
};

// Solo inicializar en el browser
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n
    .use(LanguageDetector) // Detecta idioma del navegador
    .use(initReactI18next) // Pasa i18n a react-i18next
    .init({
      resources,
      fallbackLng: 'en', // Idioma por defecto si no se detecta
      lng: 'es', // Idioma inicial
      debug: process.env.NODE_ENV === 'development',

      interpolation: {
        escapeValue: false, // React ya escapa por defecto
      },

      detection: {
        // Orden de detección
        order: ['localStorage', 'navigator', 'htmlTag'],
        caches: ['localStorage'],
      },

      react: {
        useSuspense: false, // Importante para Next.js
      },
    });
}

export default i18n;
