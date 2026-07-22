import { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    return localStorage.getItem('locale') || 'en';
  });

  const changeLocale = (next) => {
    setLocale(next);
    localStorage.setItem('locale', next);
  };

  const t = (key, params) => {
    let text = translations[locale]?.[key] || translations.en[key] || key;
    if (params) {
      Object.keys(params).forEach((k) => {
        text = text.replace(`{${k}}`, params[k]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);