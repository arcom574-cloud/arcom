'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';
import { supabaseAdmin } from '@/lib/supabase';

type Post = {
  id: string; slug: string; title_ar: string; title_en: string;
  category_ar: string; category_en: string; excerpt_ar: string; excerpt_en: string;
  img: string; read_time: number; published: boolean; created_at: string;
};

const categories = ['الكل', 'استثمار', 'دليل', 'نصائح', 'تمويل', 'سياحة', 'أخبار'];
const categoriesEn = ['All', 'Investment', 'Guide', 'Tips', 'Finance', 'Tourism', 'News'];

export default function BlogPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  const [filter, setFilter] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseAdmin.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false });
      if (data) setPosts(data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = filter === 0 ? posts : posts.filter(p => isAr ? p.category_ar === categories[filter] : p.category_en === categoriesEn[filter]);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>
    </div>
  );

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

      <div style={{ textAlign: 'center', padding: isMobile ? '60px 24px 32px' : '140px 40px 48px', direction: 'rtl', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(27,75,138,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '6px', marginBottom: '16px', fontWeight: 600 }}>BLOG</p>
        <h1 style={{ fontSize: isMobile ? '36px' : '64px', fontWeight: 900, color: 'white', margin: '0 0 16px', letterSpacing: '-2px' }}>
          {isAr ? 'المدونة' : 'Blog'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '500px', margin: '0 auto 40px' }}>
          {isAr ? 'أخبار ومقالات عقارية متخصصة' : 'Specialized real estate news and articles'}
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {(isAr ? categories : categoriesEn).map((c, i) => (
            <button key={c} onClick={() => setFilter(i)} style={{ backgroundColor: filter === i ? '#1B4B8A' : 'rgba(255,255,255,0.05)', border: filter === i ? '1px solid #4A90D9' : '1px solid rgba(255,255,255,0.1)', color: filter === i ? 'white' : 'rgba(255,255,255,0.5)', padding: '7px 20px', borderRadius: '50px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', fontFamily: 'Cairo, sans-serif' }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '0 24px 120px' : '0 40px 80px', direction: 'rtl' }}>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
            <p>{isAr ? 'لا يوجد مقالات بعد' : 'No articles yet'}</p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {filter === 0 && filtered[0] && (
              <Link href={`/${locale}/blog/${filtered[0].slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
                <div style={{ position: 'relative', height: isMobile ? '280px' : '420px', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${filtered[0].img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,20,0.95) 0%, rgba(5,10,20,0.3) 60%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', top: '24px', right: '24px', backgroundColor: '#1B4B8A', borderRadius: '50px', padding: '5px 16px', color: '#4A90D9', fontSize: '11px', letterSpacing: '2px', border: '1px solid rgba(74,144,217,0.4)' }}>
                    {isAr ? filtered[0].category_ar : filtered[0].category_en}
                  </div>
                  <div style={{ position: 'absolute', bottom: '32px', right: '32px', maxWidth: '600px' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '8px' }}>
                      {filtered[0].created_at?.slice(0, 10)} · {filtered[0].read_time} {isAr ? 'دقائق قراءة' : 'min read'}
                    </p>
                    <h2 style={{ fontSize: isMobile ? '22px' : '32px', fontWeight: 900, color: 'white', margin: '0 0 8px', lineHeight: 1.2 }}>
                      {isAr ? filtered[0].title_ar : filtered[0].title_en}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: 1.6 }}>
                      {isAr ? filtered[0].excerpt_ar : filtered[0].excerpt_en}
                    </p>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px' }}>
              {(filter === 0 ? filtered.slice(1) : filtered).map(post => (
                <Link key={post.slug} href={`/${locale}/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', transition: 'all 0.3s', height: '100%' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,144,217,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ height: '180px', backgroundImage: `url(${post.img})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(27,75,138,0.8)', borderRadius: '50px', padding: '4px 12px', color: '#4A90D9', fontSize: '10px', border: '1px solid rgba(74,144,217,0.3)' }}>
                        {isAr ? post.category_ar : post.category_en}
                      </div>
                    </div>
                    <div style={{ padding: '20px' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginBottom: '8px' }}>
                        {post.created_at?.slice(0, 10)} · {post.read_time} {isAr ? 'دقائق' : 'min'}
                      </p>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '8px', lineHeight: 1.4 }}>
                        {isAr ? post.title_ar : post.title_en}
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: 1.7 }}>
                        {isAr ? post.excerpt_ar : post.excerpt_en}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {!isMobile && <Footer />}
      {isMobile && <MobileNav />}

    </main>
  );
}