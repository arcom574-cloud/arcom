'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import HeroSection from '@/components/website/HeroSection';
import ProjectsSection from '@/components/website/ProjectsSection';
import ProjectsMap from '@/components/website/ProjectsMap';
import StatsSection from '@/components/website/StatsSection';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Logo from '@/components/website/Logo';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';
import MobileHero from '@/components/website/MobileHero';
import ChatBot from '@/components/website/ChatBot';

export default function Home() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    setMounted(true);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif', overflowX: 'hidden' }}>

      {(!mounted || !isMobile) && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}/about`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'من نحن' : 'About Us'}</Link>
              <Link href={`/${locale}/contact`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitcher locale={locale} compact />
              <a href="https://wa.me/201000000000" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '6px 18px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>{isAr ? 'واتساب' : 'WhatsApp'}</a>
              <Link href="/crm" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', padding: '6px 18px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px' }}>
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </Link>
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      {mounted && isMobile && <MobileHero />}
      {mounted && !isMobile && <HeroSection />}

      {(!mounted || !isMobile) && <StatsSection />}

      <ProjectsSection />
      <ProjectsMap />

      <section style={{ padding: '80px 32px', margin: '0 32px 80px', borderRadius: '32px', background: 'linear-gradient(135deg, rgba(27,75,138,0.3) 0%, rgba(74,144,217,0.1) 100%)', border: '1px solid rgba(27,75,138,0.3)', textAlign: 'center' }}>
        <h2 style={{ fontSize: mounted && isMobile ? '26px' : '40px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
          {isAr ? 'مهتم بأحد مشاريعنا؟' : 'Interested in Our Projects?'}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '32px' }}>
          {isAr ? 'تواصل معنا الآن وسيقوم فريقنا بمساعدتك' : 'Contact us now and our team will assist you'}
        </p>
        <a href="https://wa.me/201000000000" style={{ backgroundColor: '#25D366', color: 'white', padding: '16px 48px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 700, boxShadow: '0 0 40px rgba(37,211,102,0.3)' }}>
          {isAr ? 'تواصل على واتساب' : 'Contact on WhatsApp'}
        </a>
      </section>

      {(!mounted || !isMobile) && <Footer />}

      {mounted && (
        <>
          {!isMobile && <a href="https://wa.me/201000000000" target="_blank" style={{ position: 'fixed', bottom: '32px', left: '32px', width: '58px', height: '58px', backgroundColor: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', boxShadow: '0 4px 24px rgba(37,211,102,0.4)', textDecoration: 'none', zIndex: 50 }}>💬</a>}
          <ChatBot />
        </>
      )}

      {mounted && isMobile && <MobileNav />}

    </main>
  );
}