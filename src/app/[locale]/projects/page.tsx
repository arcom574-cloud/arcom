'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';
import { supabaseAdmin } from '@/lib/supabase';

type Project = {
  id: string; slug: string; name_ar: string; name_en: string;
  location_ar: string; location_en: string; type_ar: string; type_en: string;
  status_ar: string; status_en: string; desc_ar: string; desc_en: string;
  img: string; units: number; price: string;
};

export default function ProjectsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseAdmin.from('projects').select('*').eq('active', true).order('order_num');
      if (data) setProjects(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif' }}>

      {!isMobile && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
              <Link href={`/${locale}/projects`} style={{ color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>{isAr ? 'المشاريع' : 'Projects'}</Link>
              <Link href={`/${locale}/contact`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitcher locale={locale} compact />
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      {/* Hero */}
      <div style={{ paddingTop: isMobile ? '40px' : '120px', paddingBottom: '60px', textAlign: 'center', direction: isAr ? 'rtl' : 'ltr' }}>
        <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>OUR PROJECTS</p>
        <h1 style={{ fontSize: isMobile ? '36px' : '52px', fontWeight: 900, margin: '0 0 16px', letterSpacing: '-2px' }}>
          {isAr ? 'مشاريعنا' : 'Our Projects'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
          {isAr ? 'مولات تجارية في أفضل المواقع الاستراتيجية' : 'Commercial malls in the best strategic locations'}
        </p>
      </div>

      {/* Projects Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 20px 80px' : '0 40px 100px', direction: isAr ? 'rtl' : 'ltr' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px' }}>{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '24px' }}>
            {projects.map(project => (
              <Link key={project.id} href={`/${locale}/projects/${project.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.02)', transition: 'all 0.4s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,144,217,0.4)'; e.currentTarget.style.transform = 'translateY(-6px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {/* Image */}
                  <div style={{ height: '280px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${project.img})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'transform 0.6s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(5,10,20,0.95) 100%)' }} />
                    <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                      <span style={{ backgroundColor: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)', borderRadius: '50px', padding: '4px 14px', color: '#4A90D9', fontSize: '11px', backdropFilter: 'blur(8px)' }}>
                        {isAr ? project.type_ar : project.type_en}
                      </span>
                      <span style={{ backgroundColor: project.status_ar === 'متاح' ? 'rgba(37,211,102,0.15)' : 'rgba(243,156,18,0.15)', border: `1px solid ${project.status_ar === 'متاح' ? 'rgba(37,211,102,0.4)' : 'rgba(243,156,18,0.4)'}`, borderRadius: '50px', padding: '4px 14px', color: project.status_ar === 'متاح' ? '#25D366' : '#F39C12', fontSize: '11px', backdropFilter: 'blur(8px)' }}>
                        {isAr ? project.status_ar : project.status_en}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
                      {isAr ? project.name_ar : project.name_en}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 16px' }}>
                      📍 {isAr ? project.location_ar : project.location_en}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.8, margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                      {isAr ? project.desc_ar : project.desc_en}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', gap: '20px' }}>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '0 0 2px', letterSpacing: '1px' }}>{isAr ? 'الوحدات' : 'UNITS'}</p>
                          <p style={{ color: 'white', fontSize: '16px', fontWeight: 800, margin: 0 }}>{project.units}</p>
                        </div>
                        {project.price && (
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: '0 0 2px', letterSpacing: '1px' }}>{isAr ? 'يبدأ من' : 'FROM'}</p>
                            <p style={{ color: '#C9A84C', fontSize: '14px', fontWeight: 700, margin: 0 }}>{project.price}</p>
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#4A90D9', fontSize: '13px', fontWeight: 600 }}>
                        {isAr ? 'عرض المشروع ←' : '→ View Project'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '60px', padding: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(27,75,138,0.3) 0%, rgba(74,144,217,0.1) 100%)', border: '1px solid rgba(27,75,138,0.3)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>{isAr ? 'مهتم بمشاريعنا؟' : 'Interested in our projects?'}</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>{isAr ? 'تواصل معنا الآن للحصول على أفضل العروض' : 'Contact us now for the best offers'}</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/contact`} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>📞 {isAr ? 'تواصل معنا' : 'Contact Us'}</Link>
            <a href="https://wa.me/201000000000" style={{ backgroundColor: '#25D366', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>💬 {isAr ? 'واتساب' : 'WhatsApp'}</a>
          </div>
        </div>
      </div>

      {!isMobile && <Footer />}
      {isMobile && <MobileNav />}
    </main>
  );
}
