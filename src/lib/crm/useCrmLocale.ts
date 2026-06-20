'use client';
import { useState, useEffect } from 'react';
import type { CrmLocale } from './translations';

export function useCrmLocale() {
  const [locale, setLocaleState] = useState<CrmLocale>('ar');

  useEffect(() => {
    const saved = localStorage.getItem('crm_locale') as CrmLocale;
    if (saved === 'ar' || saved === 'en') setLocaleState(saved);
  }, []);

  const setLocale = (l: CrmLocale) => {
    setLocaleState(l);
    localStorage.setItem('crm_locale', l);
  };

  const toggleLocale = () => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  };

  const isAr = locale === 'ar';
  const dir: 'rtl' | 'ltr' = isAr ? 'rtl' : 'ltr';

  return { locale, setLocale, toggleLocale, isAr, dir };
}
