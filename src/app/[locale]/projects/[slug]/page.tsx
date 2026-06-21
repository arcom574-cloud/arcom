'use client';
import React, { useEffect, useState, useRef } from 'react';
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
  img: string; imgs: string[]; units: number; area: string; delivery: string;
  floors: number; price: string; features_ar: string[]; features_en: string[];
  brochure_url?: string; brochure_url_en?: string; lat?: number; lng?: number;
};

export default function ProjectPage() {
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const isAr = locale === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Project[]>([]);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseAdmin.from('projects').select('*').eq('slug', slug).single();
      setProject(data);
      const { data: relatedData } = await supabaseAdmin.from('projects').select('*').neq('slug', slug).eq('active', true).limit(3);
      setRelated(relatedData || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    const imgs = project.imgs?.length ? project.imgs : [project.img];
    if (imgs.length <= 1) return;
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setActiveImg(prev => (prev + 1) % imgs.length);
    }, 5000);
    return () => { if (autoSlideRef.current) clearInterval(autoSlideRef.current); };
  }, [project]);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontFamily: 'Cairo, sans-serif', fontSize: '16px' }}>جاري التحميل...</div>
    </div>
  );

  if (!project) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white', fontFamily: 'Cairo, sans-serif' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>المشروع غير موجود</h1>
        <Link href={`/${locale}`} style={{ color: '#4A90D9', textDecoration: 'none' }}>العودة للرئيسية</Link>
      </div>
    </main>
  );

  const images = project.imgs?.length ? project.imgs : [project.img];

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif' }}>

      {!isMobile && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
              <Link href={`/${locale}/contact`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitcher locale={locale} compact />
              <a href="https://wa.me/201000000000" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '6px 18px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>{isAr ? 'واتساب' : 'WhatsApp'}</a>
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      {/* Hero */}
      <div style={{ position: 'relative', height: isMobile ? '60vh' : '85vh', overflow: 'hidden' }}>
        {images.map((img, i) => (
          <div key={img} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: activeImg === i ? 1 : 0, transition: 'opacity 1.5s ease-in-out', zIndex: activeImg === i ? 1 : 0 }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,10,20,0.3) 0%, rgba(5,10,20,0.95) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: isAr ? 'linear-gradient(to left, rgba(5,10,20,0.85) 0%, transparent 60%)' : 'linear-gradient(to right, rgba(5,10,20,0.85) 0%, transparent 60%)' }} />

        <div style={{ position: 'absolute', bottom: isMobile ? '24px' : '60px', right: isMobile ? '24px' : '8%', direction: 'rtl', maxWidth: '600px', left: isMobile ? '24px' : 'auto' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)', borderRadius: '50px', padding: '5px 16px', color: '#4A90D9', fontSize: '11px', letterSpacing: '2px' }}>
              {isAr ? project.type_ar : project.type_en}
            </span>
            <span style={{ backgroundColor: project.status_ar === 'متاح' ? 'rgba(37,211,102,0.1)' : 'rgba(27,75,138,0.2)', border: `1px solid ${project.status_ar === 'متاح' ? 'rgba(37,211,102,0.4)' : 'rgba(74,144,217,0.4)'}`, borderRadius: '50px', padding: '5px 16px', color: project.status_ar === 'متاح' ? '#25D366' : '#4A90D9', fontSize: '11px' }}>
              {isAr ? project.status_ar : project.status_en}
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? '36px' : '64px', fontWeight: 900, color: 'white', margin: '0 0 8px', lineHeight: 1.1, letterSpacing: '-2px' }}>
            {isAr ? project.name_ar : project.name_en}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px' }}>📍 {isAr ? project.location_ar : project.location_en}</p>
        </div>

        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: isMobile ? '20px' : '50px', left: isMobile ? '20px' : '8%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {images.map((_, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: activeImg === i ? '32px' : '8px', height: '8px', borderRadius: '50px', backgroundColor: activeImg === i ? '#4A90D9' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.5s ease', boxShadow: activeImg === i ? '0 0 12px rgba(74,144,217,0.5)' : 'none' }} />
              ))}
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginLeft: '8px' }}>{activeImg + 1}/{images.length}</span>
            </div>
            {/* Thumbnails */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: isMobile ? '44px' : '60px', height: isMobile ? '33px' : '44px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: activeImg === i ? '2px solid #4A90D9' : '2px solid rgba(255,255,255,0.15)', transition: 'all 0.4s', transform: activeImg === i ? 'scale(1.1)' : 'scale(1)', boxShadow: activeImg === i ? '0 4px 16px rgba(0,0,0,0.4)' : 'none' }}>
                  <div style={{ width: '100%', height: '100%', backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: activeImg === i ? 'none' : 'brightness(0.4)' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '40px 24px 120px' : '80px 40px', direction: 'rtl' }}>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '60px' }}>
          {[
            { label: isAr ? 'عدد الوحدات' : 'Units', value: project.units, icon: '🏠' },
            { label: isAr ? 'المساحات م²' : 'Area m²', value: project.area, icon: '📐' },
            { label: isAr ? 'موعد التسليم' : 'Delivery', value: project.delivery, icon: '📅' },
            { label: isAr ? 'عدد الأدوار' : 'Floors', value: project.floors, icon: '🏢' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '60px', marginBottom: '60px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '20px' }}>{isAr ? 'عن المشروع' : 'About the Project'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '16px', lineHeight: 2, marginBottom: '40px' }}>
              {isAr ? project.desc_ar : project.desc_en}
            </p>
            {project.price && (
              <div style={{ backgroundColor: 'rgba(27,75,138,0.1)', border: '1px solid rgba(27,75,138,0.3)', borderRadius: '16px', padding: '24px' }}>
                <p style={{ color: '#4A90D9', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px' }}>{isAr ? 'السعر' : 'PRICE'}</p>
                <p style={{ color: 'white', fontSize: '22px', fontWeight: 800, margin: 0 }}>{project.price}</p>
              </div>
            )}
          </div>

          {(project.features_ar?.length > 0 || project.features_en?.length > 0) && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '20px' }}>{isAr ? 'المميزات والخدمات' : 'Features & Services'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {(isAr ? project.features_ar : project.features_en)?.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4A90D9', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Photo Album */}
        {project.imgs && project.imgs.length > 1 && (
          <div style={{ marginBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', margin: 0 }}>{isAr ? 'معرض الصور' : 'Gallery'}</h2>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>{project.imgs.length} {isAr ? 'صورة' : 'photos'}</span>
            </div>

            {/* Masonry-style grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(12, 1fr)', gap: '8px', gridAutoRows: isMobile ? '140px' : '160px' }}>
              {project.imgs.map((img, i) => {
                const spans = isMobile
                  ? { col: '1', row: '1' }
                  : i === 0 ? { col: 'span 6', row: 'span 2' }
                  : i <= 2 ? { col: 'span 3', row: 'span 1' }
                  : i <= 4 ? { col: 'span 4', row: 'span 1' }
                  : { col: 'span 3', row: 'span 1' };
                return (
                  <div key={i} onClick={() => setLightbox(i)}
                    style={{ gridColumn: spans.col, gridRow: spans.row, borderRadius: i === 0 ? '16px' : '12px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                  >
                    <img src={img} alt={`${project.name_ar} - ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)', opacity: 0, transition: 'opacity 0.3s', pointerEvents: 'none' }}
                      className="img-overlay"
                    />
                    {i === 0 && (
                      <div style={{ position: 'absolute', bottom: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: '50px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'white', fontSize: '12px' }}>{isAr ? 'الصورة الرئيسية' : 'Main Photo'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightbox !== null && images.length > 0 && (
          <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
            {/* Close */}
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', zIndex: 201, backdropFilter: 'blur(8px)' }}>✕</button>

            {/* Counter */}
            <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: '14px', zIndex: 201 }}>
              {lightbox + 1} / {project.imgs.length}
            </div>

            {/* Prev */}
            <button onClick={e => { e.stopPropagation(); setLightbox(lightbox > 0 ? lightbox - 1 : images.length - 1); }}
              style={{ position: 'absolute', right: isMobile ? '10px' : '30px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', zIndex: 201, backdropFilter: 'blur(8px)' }}>→</button>

            {/* Next */}
            <button onClick={e => { e.stopPropagation(); setLightbox(lightbox < images.length - 1 ? lightbox + 1 : 0); }}
              style={{ position: 'absolute', left: isMobile ? '10px' : '30px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', zIndex: 201, backdropFilter: 'blur(8px)' }}>←</button>

            {/* Image */}
            <img onClick={e => e.stopPropagation()} src={images[lightbox]} alt=""
              style={{ maxWidth: isMobile ? '95vw' : '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', cursor: 'default' }}
            />

            {/* Thumbnails */}
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 201 }}>
              {images.map((img, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setLightbox(i); }}
                  style={{ width: isMobile ? '40px' : '56px', height: isMobile ? '30px' : '40px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: lightbox === i ? '2px solid #4A90D9' : '2px solid rgba(255,255,255,0.2)', opacity: lightbox === i ? 1 : 0.5, transition: 'all 0.3s' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brochure + Map Row */}
        {(() => {
          const brochure = isAr ? project.brochure_url : (project.brochure_url_en || project.brochure_url);
          return (brochure || (project.lat && project.lng)) ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : brochure && project.lat ? '1fr 1fr' : '1fr', gap: '24px', marginBottom: '60px' }}>
            {/* Brochure Download */}
            {brochure && (
              <div style={{ backgroundColor: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.25)', borderRadius: '20px', padding: '32px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(230,126,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: '0 0 6px' }}>{isAr ? 'بروشور المشروع' : 'Project Brochure'}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: '0 0 12px' }}>{isAr ? 'حمّل البروشور لمعرفة كل التفاصيل' : 'Download brochure for full details'}</p>
                  <a href={brochure} target="_blank" download style={{ display: 'inline-block', backgroundColor: '#E67E22', color: 'white', padding: '10px 28px', borderRadius: '50px', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
                    📥 {isAr ? 'تحميل البروشور' : 'Download PDF'}
                  </a>
                </div>
              </div>
            )}

            {/* Location Map */}
            {project.lat && project.lng ? (
              <div style={{ backgroundColor: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.25)', borderRadius: '20px', overflow: 'hidden' }}>
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${project.lat},${project.lng}&zoom=15&maptype=satellite`}
                  style={{ width: '100%', height: '200px', border: 'none' }}
                  allowFullScreen
                  loading="lazy"
                />
                <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>📍 {isAr ? 'موقع المشروع' : 'Project Location'}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{isAr ? project.location_ar : project.location_en}</p>
                  </div>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${project.lat},${project.lng}`} target="_blank" style={{ backgroundColor: '#9B59B6', color: 'white', padding: '8px 20px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>
                    🗺️ {isAr ? 'الاتجاهات' : 'Directions'}
                  </a>
                </div>
              </div>
            ) : null}
          </div>
          ) : null;
        })()}

        <div style={{ padding: '48px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(27,75,138,0.3) 0%, rgba(74,144,217,0.1) 100%)', border: '1px solid rgba(27,75,138,0.3)', textAlign: 'center', marginBottom: related.length > 0 ? '60px' : '0' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>{isAr ? 'مهتم بهذا المشروع؟' : 'Interested in this project?'}</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px' }}>{isAr ? 'تواصل معنا الآن للحصول على معلومات أكثر' : 'Contact us now for more information'}</p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://wa.me/201000000000" style={{ backgroundColor: '#25D366', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>💬 {isAr ? 'واتساب' : 'WhatsApp'}</a>
            <a href="tel:+201000000000" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '14px 36px', borderRadius: '50px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}>📞 {isAr ? 'اتصل بنا' : 'Call Us'}</a>
          </div>
        </div>

        {related.length > 0 && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '24px' }}>{isAr ? 'مشاريع أخرى' : 'Other Projects'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '16px' }}>
              {related.map(r => (
                <Link key={r.id} href={`/${locale}/projects/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,144,217,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ height: '140px', backgroundImage: `url(${r.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{isAr ? r.name_ar : r.name_en}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>📍 {isAr ? r.location_ar : r.location_en}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {!isMobile && <Footer />}
      {isMobile && <MobileNav />}

    </main>
  );
}