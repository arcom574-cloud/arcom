'use client';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function MobileNav() {
  const params = useParams();
  const locale = params.locale as string;
  const pathname = usePathname();
  const isAr = locale === 'ar';

  const items = [
    { icon: '🏠', label: isAr ? 'الرئيسية' : 'Home', href: `/${locale}` },
    { icon: '🏢', label: isAr ? 'المشاريع' : 'Projects', href: `/${locale}/projects` },
    { icon: '💬', label: isAr ? 'واتساب' : 'WhatsApp', href: 'https://wa.me/201000000000', external: true },
    { icon: '📞', label: isAr ? 'تواصل' : 'Contact', href: `/${locale}/contact` },
  ];

  return (
    <>
      <style>{`
        .mobile-bottom-nav { display: none !important; }
        @media (max-width: 768px) { .mobile-bottom-nav { display: flex !important; } }
      `}</style>
      <div className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(4,8,15,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 0 20px',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        {items.map(item => (
          item.external ? (
            <a key={item.label} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '8px 16px' }}>
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '1px', fontFamily: 'Cairo, sans-serif' }}>{item.label}</span>
            </a>
          ) : (
            <Link key={item.label} href={item.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '8px 16px' }}>
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <span style={{ color: pathname === item.href ? '#4A90D9' : 'rgba(255,255,255,0.5)', fontSize: '10px', letterSpacing: '1px', fontFamily: 'Cairo, sans-serif' }}>{item.label}</span>
              {pathname === item.href && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#4A90D9' }} />}
            </Link>
          )
        ))}
      </div>
    </>
  );
}