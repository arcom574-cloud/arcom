'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';

const stats = [
  { num: '15+', labelAr: 'سنة خبرة', labelEn: 'Years Experience' },
  { num: '50+', labelAr: 'مشروع منجز', labelEn: 'Projects Done' },
  { num: '5000+', labelAr: 'عميل سعيد', labelEn: 'Happy Clients' },
  { num: '10+', labelAr: 'مدينة', labelEn: 'Cities' },
];

const team = [
  { nameAr: 'أحمد محمد', nameEn: 'Ahmed Mohamed', roleAr: 'الرئيس التنفيذي', roleEn: 'CEO', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80' },
  { nameAr: 'محمد علي', nameEn: 'Mohamed Ali', roleAr: 'مدير المشاريع', roleEn: 'Projects Manager', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' },
  { nameAr: 'سارة أحمد', nameEn: 'Sara Ahmed', roleAr: 'مدير التطوير', roleEn: 'Development Director', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80' },
];

const values = [
  { icon: '🏆', titleAr: 'الجودة', titleEn: 'Quality', descAr: 'نلتزم بأعلى معايير الجودة في كل مشروع', descEn: 'We commit to the highest quality standards in every project' },
  { icon: '🤝', titleAr: 'الثقة', titleEn: 'Trust', descAr: 'نبني علاقات طويلة الأمد مع عملائنا', descEn: 'We build long-term relationships with our clients' },
  { icon: '💡', titleAr: 'الابتكار', titleEn: 'Innovation', descAr: 'نستخدم أحدث التقنيات في التصميم والبناء', descEn: 'We use the latest technologies in design and construction' },
  { icon: '🌱', titleAr: 'الاستدامة', titleEn: 'Sustainability', descAr: 'نراعي البيئة في كل مشاريعنا', descEn: 'We consider the environment in all our projects' },
];

export default function AboutPage() {
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

  useEffect(() => {
    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo('.about-hero', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 1, delay: 0.3, ease: 'power3.out' });
    };
    if (mounted) init();
  }, [mounted]);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif' }}>

      {(!mounted || !isMobile) && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
              <Link href={`/${locale}/projects`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'المشاريع' : 'Projects'}</Link>
              <Link href={`/${locale}/contact`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitcher locale={locale} compact />
              <a href="https://wa.me/201000000000" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '6px 18px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>{isAr ? 'واتساب' : 'WhatsApp'}</a>
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      {/* Hero */}
      <div style={{ position: 'relative', height: mounted && isMobile ? '50vh' : '70vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,10,20,0.6) 0%, rgba(5,10,20,0.95) 100%)' }} />
        <div className="about-hero" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', opacity: 0, padding: '0 24px', paddingTop: mounted && isMobile ? '0' : '80px' }}>
          <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '6px', marginBottom: '16px', fontWeight: 600 }}>ABOUT US</p>
          <h1 style={{ fontSize: mounted && isMobile ? '36px' : '64px', fontWeight: 900, color: 'white', margin: '0 0 16px', letterSpacing: '-2px', lineHeight: 1.1 }}>
            {isAr ? 'من نحن' : 'About Us'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', maxWidth: '500px' }}>
            {isAr ? 'شركة عقارية رائدة في مصر منذ 2009' : 'A leading real estate company in Egypt since 2009'}
          </p>
        </div>
      </div>

      {/* Story */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: mounted && isMobile ? '60px 24px' : '100px 40px', direction: 'rtl' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mounted && isMobile ? '1fr' : '1fr 1fr', gap: '80px', alignItems: 'center', marginBottom: '100px' }}>
          <div>
            <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>OUR STORY</p>
            <h2 style={{ fontSize: mounted && isMobile ? '32px' : '48px', fontWeight: 900, color: 'white', margin: '0 0 24px', lineHeight: 1.2 }}>
              {isAr ? 'قصتنا مع التطوير العقاري' : 'Our Story in Real Estate'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 2, marginBottom: '20px' }}>
              {isAr ? 'تأسست شركة أركوم للتطوير العقاري عام 2009 برؤية واضحة لتغيير مفهوم الإسكان والتطوير العقاري في مصر. بدأنا بمشروع سكني صغير في القاهرة الجديدة، ونمونا لنصبح من أبرز المطورين العقاريين في مصر.' : 'Arcom Developments was founded in 2009 with a clear vision to transform the concept of housing and real estate development in Egypt. We started with a small residential project in New Cairo and grew to become one of the most prominent real estate developers in Egypt.'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 2 }}>
              {isAr ? 'على مدار أكثر من 15 عاماً، أسلمنا أكثر من 50 مشروعاً ناجحاً في مختلف أنحاء مصر، وأصبحنا الخيار الأول لآلاف العملاء الباحثين عن الجودة والموثوقية.' : 'Over more than 15 years, we have delivered over 50 successful projects across Egypt, becoming the first choice for thousands of clients seeking quality and reliability.'}
            </p>
          </div>
          <div style={{ position: 'relative', height: '400px', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(27,75,138,0.3) 0%, transparent 60%)' }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: mounted && isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px', marginBottom: '100px' }}>
          {stats.map(s => (
            <div key={s.num} style={{ textAlign: 'center', padding: '40px 24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(27,75,138,0.15) 0%, rgba(5,10,20,0.6) 100%)', border: '1px solid rgba(74,144,217,0.15)' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: 'white', lineHeight: 1, marginBottom: '8px', background: 'linear-gradient(135deg, #fff 0%, #4A90D9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.num}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>{isAr ? s.labelAr : s.labelEn}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div style={{ marginBottom: '100px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>OUR VALUES</p>
            <h2 style={{ fontSize: mounted && isMobile ? '28px' : '44px', fontWeight: 900, color: 'white', margin: 0 }}>
              {isAr ? 'قيمنا ومبادئنا' : 'Our Values'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mounted && isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '20px' }}>
            {values.map(v => (
              <div key={v.titleAr} style={{ padding: '32px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,144,217,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{v.icon}</div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>{isAr ? v.titleAr : v.titleEn}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.8 }}>{isAr ? v.descAr : v.descEn}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div style={{ marginBottom: '80px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>OUR TEAM</p>
            <h2 style={{ fontSize: mounted && isMobile ? '28px' : '44px', fontWeight: 900, color: 'white', margin: 0 }}>
              {isAr ? 'فريق العمل' : 'Our Team'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: mounted && isMobile ? '1fr' : 'repeat(3,1fr)', gap: '24px' }}>
            {team.map(t => (
              <div key={t.nameAr} style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <div style={{ height: '280px', backgroundImage: `url(${t.img})`, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '6px' }}>{isAr ? t.nameAr : t.nameEn}</h3>
                  <p style={{ color: '#4A90D9', fontSize: '13px', letterSpacing: '1px' }}>{isAr ? t.roleAr : t.roleEn}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '60px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(27,75,138,0.3) 0%, rgba(74,144,217,0.1) 100%)', border: '1px solid rgba(27,75,138,0.3)', textAlign: 'center' }}>
          <h2 style={{ fontSize: mounted && isMobile ? '24px' : '36px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>
            {isAr ? 'هل أنت مهتم بالتعاون معنا؟' : 'Interested in working with us?'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>
            {isAr ? 'تواصل معنا الآن ونحن سنساعدك في إيجاد مشروعك المثالي' : 'Contact us now and we will help you find your perfect project'}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/contact`} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>
              {isAr ? 'تواصل معنا' : 'Contact Us'}
            </Link>
            <Link href={`/${locale}/projects`} style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 600 }}>
              {isAr ? 'عرض المشاريع' : 'View Projects'}
            </Link>
          </div>
        </div>
      </div>

      {(!mounted || !isMobile) && <Footer />}
      {mounted && isMobile && <MobileNav />}

    </main>
  );
}