'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MobileHero() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [heroImg, setHeroImg] = useState('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80');

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('key', 'hero_img');
      if (data?.[0]?.value) setHeroImg(data[0].value);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const init = async () => {
      const { gsap } = await import('gsap');
      gsap.fromTo('.m-logo', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.2 });
      gsap.fromTo('.m-title', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.5 });
      gsap.fromTo('.m-sub', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.9 });
      gsap.fromTo('.m-btns', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 1.1 });
      gsap.fromTo('.m-stats', { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 1.4, stagger: 0.1 });
    };
    init();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `url(${heroImg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      position: 'relative', direction: 'rtl',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Overlay أغمق */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(4,8,15,0.85) 0%, rgba(4,8,15,0.75) 40%, rgba(4,8,15,0.97) 100%)' }} />

      {/* Header */}
      <div className="m-logo" style={{ position: 'relative', zIndex: 2, padding: '52px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Image src="/logo.png" alt="Arcom" width={120} height={40} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <Link href={locale === 'ar' ? '/en' : '/ar'} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px', color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          {locale === 'ar' ? 'EN' : 'عربي'}
        </Link>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, padding: '24px 24px 120px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>

        <p style={{ color: '#4A90D9', fontSize: '10px', letterSpacing: '5px', marginBottom: '12px' }}>PREMIUM REAL ESTATE</p>

        <h1 className="m-title" style={{ opacity: 0, fontSize: '52px', fontWeight: 900, color: 'white', margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-2px' }}>
          {isAr ? 'نبني' : 'Building'}
        </h1>
        <h1 style={{ fontSize: '52px', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.1, letterSpacing: '-2px', background: 'linear-gradient(135deg, #E8E0D0 0%, #4A90D9 55%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {isAr ? 'مستقبلك' : 'Your Future'}
        </h1>

        <p className="m-sub" style={{ opacity: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: 1.8 }}>
          {isAr ? 'مطور عقاري متميز في مصر بأعلى معايير الجودة' : 'Premium real estate developer in Egypt'}
        </p>

        <div className="m-btns" style={{ opacity: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          <Link href={`/${locale}/projects`} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '16px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, textAlign: 'center', boxShadow: '0 8px 32px rgba(27,75,138,0.5)' }}>
            {isAr ? 'استكشف المشاريع' : 'Explore Projects'}
          </Link>
          <a href="https://wa.me/201000000000" style={{ backgroundColor: '#25D366', color: 'white', padding: '16px', borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, textAlign: 'center' }}>
            💬 {isAr ? 'تواصل على واتساب' : 'WhatsApp'}
          </a>
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
          {[
            { num: '+15', label: isAr ? 'سنة خبرة' : 'Years' },
            { num: '+50', label: isAr ? 'مشروع' : 'Projects' },
            { num: '+5K', label: isAr ? 'عميل' : 'Clients' },
          ].map((s, i) => (
            <div key={s.label} className="m-stats" style={{ opacity: 0, flex: 1, textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}