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
  content_ar: string; content_en: string; img: string; read_time: number;
  published: boolean; created_at: string;
};

export default function BlogPostPage() {
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const isAr = locale === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabaseAdmin.from('blog_posts').select('*').eq('slug', slug).single();
      setPost(data);
      const { data: relatedData } = await supabaseAdmin.from('blog_posts').select('*').neq('slug', slug).eq('published', true).limit(3);
      setRelated(relatedData || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>
    </div>
  );

  if (!post) return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'white', fontFamily: 'Cairo, sans-serif' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>المقال غير موجود</h1>
        <Link href={`/${locale}/blog`} style={{ color: '#4A90D9', textDecoration: 'none' }}>العودة للمدونة</Link>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif' }}>

      {!isMobile && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
              <Link href={`/${locale}/blog`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'المدونة' : 'Blog'}</Link>
              <Link href={`/${locale}/contact`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitcher locale={locale} compact />
              <a href="https://wa.me/201000000000" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '6px 18px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>{isAr ? 'واتساب' : 'WhatsApp'}</a>
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      <div style={{ position: 'relative', height: isMobile ? '50vh' : '65vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${post.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,10,20,0.5) 0%, rgba(5,10,20,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: isMobile ? '24px' : '60px', right: isMobile ? '24px' : '8%', direction: 'rtl', maxWidth: '700px', left: isMobile ? '24px' : 'auto' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ backgroundColor: 'rgba(27,75,138,0.6)', border: '1px solid rgba(74,144,217,0.4)', borderRadius: '50px', padding: '4px 14px', color: '#4A90D9', fontSize: '11px' }}>
              {isAr ? post.category_ar : post.category_en}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
              {post.created_at?.slice(0, 10)} · {post.read_time} {isAr ? 'دقائق قراءة' : 'min read'}
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? '24px' : '48px', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>
            {isAr ? post.title_ar : post.title_en}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '40px 24px 120px' : '80px 40px', direction: 'rtl' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '48px', color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
          <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
          <span>/</span>
          <Link href={`/${locale}/blog`} style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{isAr ? 'المدونة' : 'Blog'}</Link>
          <span>/</span>
          <span style={{ color: '#4A90D9' }}>{isAr ? post.category_ar : post.category_en}</span>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '17px', lineHeight: 2.2 }}>
          {(isAr ? post.content_ar : post.content_en)?.split('\n\n').map((para, i) => {
            if (para.startsWith('**') && para.endsWith('**')) {
              return <h2 key={i} style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: 800, color: 'white', margin: '40px 0 16px' }}>{para.replace(/\*\*/g, '')}</h2>;
            }
            if (para.startsWith('**')) {
              return <h3 key={i} style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: '32px 0 12px' }}>{para.replace(/\*\*/g, '')}</h3>;
            }
            return <p key={i} style={{ marginBottom: '24px' }}>{para}</p>;
          })}
        </div>

        <div style={{ marginTop: '60px', padding: '32px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>{isAr ? 'شارك المقال' : 'Share Article'}</p>
          <a href={`https://wa.me/?text=${isAr ? post.title_ar : post.title_en}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#25D366', color: 'white', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            💬 {isAr ? 'مشاركة على واتساب' : 'Share on WhatsApp'}
          </a>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: '60px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', marginBottom: '24px' }}>
              {isAr ? 'مقالات ذات صلة' : 'Related Articles'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '16px' }}>
              {related.map(r => (
                <Link key={r.slug} href={`/${locale}/blog/${r.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', transition: 'all 0.3s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,144,217,0.3)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ height: '120px', backgroundImage: `url(${r.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ padding: '16px' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1.5 }}>
                        {isAr ? r.title_ar : r.title_en}
                      </h3>
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