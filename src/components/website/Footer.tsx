'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/website/Logo';
import { supabaseAdmin } from '@/lib/supabase';

type Settings = Record<string, string>;

export default function Footer() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [settings, setSettings] = useState<Settings>({
    phone: '+20 100 000 0000',
    email: 'info@arcom.com',
    address_ar: 'القاهرة، مصر',
    address_en: 'Cairo, Egypt',
    whatsapp: '201000000000',
    facebook: '#',
    instagram: '#',
    youtube: '#',
  });
  const [projects, setProjects] = useState<{ slug: string; name_ar: string; name_en: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: settingsData } = await supabaseAdmin.from('settings').select('*');
      if (settingsData) {
        const obj: Settings = {};
        settingsData.forEach((row: any) => { obj[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...obj }));
      }
      const { data: projectsData } = await supabaseAdmin.from('projects').select('slug, name_ar, name_en').eq('active', true).order('order_num').limit(4);
      if (projectsData) setProjects(projectsData);
    };
    load();
  }, []);

  const companyLinks = [
    { ar: 'من نحن', en: 'About Us', href: `/${locale}/about` },
    { ar: 'الأخبار', en: 'News', href: `/${locale}/blog` },
    { ar: 'تواصل معنا', en: 'Contact', href: `/${locale}/contact` },
  ];

  const socials = [
    { icon: 'f', label: 'Facebook', color: '#1877F2', href: settings.facebook || '#' },
    { icon: 'in', label: 'Instagram', color: '#E1306C', href: settings.instagram || '#' },
    { icon: 'yt', label: 'YouTube', color: '#FF0000', href: settings.youtube || '#' },
  ];

  return (
    <footer style={{ backgroundColor: '#02050D', borderTop: '1px solid rgba(255,255,255,0.05)', direction: isAr ? 'rtl' : 'ltr', fontFamily: 'Cairo, sans-serif' }}>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 32px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px' }}>

          {/* Brand */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <Logo height={110} href={`/${locale}`} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', lineHeight: 1.9, maxWidth: '280px', marginBottom: '28px' }}>
              {isAr ? 'مطور عقاري متميز يقدم أفضل المشاريع السكنية والتجارية في مصر بأعلى معايير الجودة.' : 'A premium real estate developer offering the finest projects in Egypt with the highest quality standards.'}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              {socials.map(s => (
                <a key={s.label} href={s.href} style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${s.color}20`; e.currentTarget.style.borderColor = s.color; e.currentTarget.style.color = s.color; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                >{s.icon}</a>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h4 style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', marginBottom: '24px' }}>
              {isAr ? 'المشاريع' : 'PROJECTS'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {projects.map(p => (
                <Link key={p.slug} href={`/${locale}/projects/${p.slug}`} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >{isAr ? p.name_ar : p.name_en}</Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', marginBottom: '24px' }}>
              {isAr ? 'الشركة' : 'COMPANY'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {companyLinks.map(item => (
                <Link key={item.ar} href={item.href} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.3s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >{isAr ? item.ar : item.en}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: 'white', fontSize: '13px', fontWeight: 700, letterSpacing: '2px', marginBottom: '24px' }}>
              {isAr ? 'تواصل معنا' : 'CONTACT'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '📍', text: isAr ? (settings.address_ar || 'القاهرة، مصر') : (settings.address_en || 'Cairo, Egypt') },
                { icon: '📞', text: settings.phone || '+20 100 000 0000' },
                { icon: '✉️', text: settings.email || 'info@arcom.com' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px' }}>{item.icon}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>{item.text}</span>
                </div>
              ))}
              <a href={`https://wa.me/${settings.whatsapp || '201000000000'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '8px', padding: '10px 16px', color: '#25D366', textDecoration: 'none', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>
                💬 {isAr ? 'واتساب' : 'WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Link href={`/${locale}/privacy-policy`} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
            <Link href={`/${locale}/terms`} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >{isAr ? 'الشروط والأحكام' : 'Terms of Service'}</Link>
            <Link href={`/${locale}/data-deletion`} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4A90D9'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
            >{isAr ? 'حذف البيانات' : 'Data Deletion'}</Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', margin: 0 }}>
              ©️ 2026 {settings.company_name_en || 'Arcom Developments'}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px', margin: 0 }}>
              {isAr ? 'تم التطوير بواسطة' : 'Developed by'}{' '}
              <span style={{ color: 'rgba(74,144,217,0.5)' }}>Masool Systems</span>
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
}