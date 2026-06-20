'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Settings = Record<string, string>;

export default function HeroSection() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [settings, setSettings] = useState<Settings>({
    hero_title_ar: 'نبني',
    hero_title2_ar: 'مستقبلك',
    hero_title_en: 'Building',
    hero_title2_en: 'Your Future',
    hero_desc_ar: 'مطور عقاري متميز يقدم أفضل المشاريع السكنية والتجارية في مصر بأعلى معايير الجودة',
    hero_desc_en: 'A premium real estate developer offering the finest projects in Egypt',
    hero_img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80',
    whatsapp: '201000000000',
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const obj: Settings = {};
        data.forEach((row: any) => { obj[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...obj }));
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const init = async () => {
      const { gsap } = await import('gsap');

      const heroBg = document.querySelector('.hero-bg');
      if (!heroBg) return;

      gsap.set(['.hero-bg', '.hero-overlay-l', '.hero-tag', '.hero-t1', '.hero-t2', '.hero-sub', '.hero-btn-1', '.hero-btn-2', '.hero-stat', '.hero-divider'], { opacity: 0 });

      const tl = gsap.timeline({ delay: 0.2 });
      tl.fromTo('.hero-bg', { x: -80, opacity: 0, scale: 1.1 }, { x: 0, opacity: 0.4, scale: 1, duration: 1.8, ease: 'power3.out' })
        .to('.hero-overlay-l', { opacity: 1, duration: 0.6 }, '-=1')
        .fromTo('.hero-tag', { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5')
        .fromTo('.hero-t1', { opacity: 0, y: 100, skewY: 3 }, { opacity: 1, y: 0, skewY: 0, duration: 0.9, ease: 'power4.out' }, '-=0.3')
        .fromTo('.hero-t2', { opacity: 0, y: 100, skewY: 3 }, { opacity: 1, y: 0, skewY: 0, duration: 0.9, ease: 'power4.out' }, '-=0.6')
        .fromTo('.hero-divider', { opacity: 0, scaleX: 0, transformOrigin: 'right' }, { opacity: 1, scaleX: 1, duration: 0.6, ease: 'power3.inOut' }, '-=0.3')
        .fromTo('.hero-sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2')
        .fromTo('.hero-btn-1', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.2')
        .fromTo('.hero-btn-2', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
        .fromTo('.hero-stat', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out' }, '-=0.2');

      let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;
      let animId: number;
      let running = true;

      const handleMouse = (e: MouseEvent) => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 15;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 15;
      };

      const animate = () => {
  if (!running) return;
  currentX += (mouseX - currentX) * 0.05;
  currentY += (mouseY - currentY) * 0.05;
  const heroBg = document.querySelector('.hero-bg');
  const heroGlow = document.querySelector('.hero-glow');
  if (!heroBg || !heroGlow) { running = false; return; }
  gsap.set('.hero-bg', { x: currentX, y: currentY });
  gsap.set('.hero-glow', { x: -currentX * 0.5, y: -currentY * 0.5 });
  animId = requestAnimationFrame(animate);
};

      window.addEventListener('mousemove', handleMouse);
      animId = requestAnimationFrame(animate);

      return () => {
        running = false;
        window.removeEventListener('mousemove', handleMouse);
        cancelAnimationFrame(animId);
      };
    };
    init();
  }, []);

  return (
    <section style={{ height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#04080F', display: 'flex', alignItems: 'center', direction: 'rtl' }}>

      <div className="hero-bg" style={{ position: 'absolute', inset: '-8%', backgroundImage: `url(${settings.hero_img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0, willChange: 'transform' }} />

      <div className="hero-overlay-l" style={{ position: 'absolute', inset: 0, opacity: 0, background: 'linear-gradient(to left, rgba(4,8,15,0.97) 38%, rgba(4,8,15,0.75) 65%, rgba(4,8,15,0.15) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #04080F 0%, transparent 18%, transparent 82%, #04080F 100%)' }} />

      <div className="hero-glow" style={{ position: 'absolute', top: '35%', right: '22%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(27,75,138,0.22) 0%, transparent 70%)', pointerEvents: 'none', willChange: 'transform' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '48%', marginRight: '7%', marginLeft: 'auto', padding: '0 3%' }}>

        <div className="hero-tag" style={{ opacity: 0, display: 'inline-flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <span style={{ color: '#4A90D9', fontSize: '10px', letterSpacing: '7px', fontWeight: 600 }}>PREMIUM REAL ESTATE</span>
          <div style={{ width: '48px', height: '1px', backgroundColor: '#4A90D9', opacity: 0.7 }} />
        </div>

        <div style={{ marginBottom: '2px', paddingBottom: '12px' }}>
          <h1 className="hero-t1" style={{ opacity: 0, fontSize: 'clamp(48px, 5.5vw, 76px)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, letterSpacing: '-3px' }}>
            {isAr ? settings.hero_title_ar : settings.hero_title_en}
          </h1>
        </div>

        <div style={{ marginBottom: '28px', paddingBottom: '12px' }}>
          <h1 className="hero-t2" style={{ opacity: 0, fontSize: 'clamp(48px, 5.5vw, 76px)', fontWeight: 900, margin: 0, lineHeight: 1.1, letterSpacing: '-3px', background: 'linear-gradient(135deg, #E8E0D0 0%, #4A90D9 50%, #1B4B8A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isAr ? settings.hero_title2_ar : settings.hero_title2_en}
          </h1>
        </div>

        <div className="hero-divider" style={{ opacity: 0, width: '72px', height: '1px', background: 'linear-gradient(to left, transparent, #4A90D9)', marginBottom: '24px' }} />

        <p className="hero-sub" style={{ opacity: 0, fontSize: '15px', color: 'rgba(255,255,255,0.42)', marginBottom: '44px', lineHeight: 2, maxWidth: '380px' }}>
          {isAr ? settings.hero_desc_ar : settings.hero_desc_en}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '56px', flexWrap: 'wrap' }}>
          <Link className="hero-btn-1" href={`/${locale}/projects`} style={{ opacity: 0, backgroundColor: '#1B4B8A', color: 'white', padding: '14px 36px', borderRadius: '2px', textDecoration: 'none', fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', display: 'block', boxShadow: '0 8px 40px rgba(27,75,138,0.5)' }}>
            {isAr ? 'استكشف المشاريع' : 'Explore Projects'}
          </Link>
          <a className="hero-btn-2" href={`/${locale}/contact`} style={{ opacity: 0, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '14px 36px', borderRadius: '2px', textDecoration: 'none', fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px', display: 'block', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[
            { num: '+15', label: isAr ? 'سنة خبرة' : 'Years' },
            { num: '+50', label: isAr ? 'مشروع' : 'Projects' },
            { num: '+5K', label: isAr ? 'عميل' : 'Clients' },
          ].map((s, i) => (
            <div key={s.label} className="hero-stat" style={{ opacity: 0, paddingLeft: i > 0 ? '32px' : 0, marginLeft: i > 0 ? '32px' : 0, borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>{s.num}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '5px', letterSpacing: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '8px', letterSpacing: '6px' }}>SCROLL</span>
        <div style={{ width: '1px', height: '52px', background: 'linear-gradient(to bottom, rgba(74,144,217,0.8), transparent)', animation: 'scrollAnim 2s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes scrollAnim {
          0% { transform: scaleY(0); transform-origin: top; opacity: 1; }
          50% { transform: scaleY(1); transform-origin: top; opacity: 1; }
          51% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
          100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
        }
      `}</style>
    </section>
  );
}