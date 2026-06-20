'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function LanguageSwitcher({ locale, compact = false }: { locale: string; compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={switchLocale}
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: compact ? '4px 12px' : '6px 16px',
        color: 'rgba(255,255,255,0.7)',
        fontSize: compact ? '12px' : '13px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'Cairo, sans-serif',
        letterSpacing: '1px',
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = 'rgba(74,144,217,0.15)';
        e.currentTarget.style.borderColor = 'rgba(74,144,217,0.4)';
        e.currentTarget.style.color = 'white';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
      }}
    >
      {locale === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
}