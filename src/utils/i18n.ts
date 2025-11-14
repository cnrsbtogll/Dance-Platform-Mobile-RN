import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

const resources = {
  tr: {
    translation: tr,
  },
  en: {
    translation: en,
  },
};

// Get device language or default to Turkish
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'tr';
const initialLanguage = deviceLanguage === 'en' ? 'en' : 'tr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'tr',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

