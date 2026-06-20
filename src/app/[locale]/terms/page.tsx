'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';

export default function TermsPage() {
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

  const sectionsAr = [
    { title: 'الموافقة على الشروط', body: 'باستخدامك لموقع Arcom Developments أو تقديم بياناتك من خلال نماذج التواصل، الشات بوت، أو نماذج الإعلانات على فيسبوك وجوجل، فإنك توافق على هذه الشروط.' },
    { title: 'طبيعة الخدمة', body: 'يقدم هذا الموقع معلومات تسويقية عن مشاريع Arcom Developments العقارية. المعلومات المعروضة (الأسعار، المساحات، مواعيد التسليم) قد تتغير دون إشعار مسبق وتُعتبر إرشادية وغير نهائية حتى توقيع عقد رسمي.</p>' },
    { title: 'استخدام الشات بوت', body: 'الشات بوت "كريم" أداة آلية تعمل بالذكاء الاصطناعي لتقديم معلومات أولية عن المشاريع. الردود مقدمة لأغراض إعلامية فقط ولا تُعتبر عرضاً ملزماً قانونياً.' },
    { title: 'الملكية الفكرية', body: 'جميع المحتويات على هذا الموقع (نصوص، صور، تصاميم) مملوكة لـ Arcom Developments ولا يجوز نسخها أو إعادة نشرها دون إذن كتابي.' },
    { title: 'حدود المسؤولية', body: 'لا تتحمل Arcom Developments مسؤولية أي قرار يُتخذ بناءً على معلومات أولية من الموقع أو الشات بوت دون التحقق الرسمي من فريق المبيعات.' },
    { title: 'التعديلات', body: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت، ويعتبر استمرار استخدامك للموقع بعد التعديل موافقة على الشروط الجديدة.' },
    { title: 'التواصل', body: 'لأي استفسار بخصوص هذه الشروط، يرجى التواصل معنا عبر صفحة "تواصل معنا".' },
  ];

  const sectionsEn = [
    { title: 'Acceptance of Terms', body: 'By using the Arcom Developments website or submitting your data through our contact forms, chatbot, or Facebook/Google ad lead forms, you agree to these terms.' },
    { title: 'Nature of Service', body: 'This website provides marketing information about Arcom Developments real estate projects. Displayed information (prices, areas, delivery dates) is subject to change without notice and is indicative only until a formal contract is signed.' },
    { title: 'Use of Chatbot', body: 'The "Karim" chatbot is an AI-powered tool providing preliminary information about our projects. Responses are for informational purposes only and do not constitute a legally binding offer.' },
    { title: 'Intellectual Property', body: 'All content on this website (text, images, designs) is owned by Arcom Developments and may not be copied or republished without written permission.' },
    { title: 'Limitation of Liability', body: 'Arcom Developments is not liable for any decision made based on preliminary information from the website or chatbot without formal verification from our sales team.' },
    { title: 'Changes to Terms', body: 'We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.' },
    { title: 'Contact', body: 'For any questions regarding these terms, please contact us via our Contact page.' },
  ];

  const sections = isAr ? sectionsAr : sectionsEn;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif' }}>

      {(!mounted || !isMobile) && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
              <Link href={`/${locale}/contact`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'تواصل معنا' : 'Contact'}</Link>
              <LanguageSwitcher locale={locale} compact />
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: mounted && isMobile ? '100px 24px 80px' : '160px 40px 100px', direction: isAr ? 'rtl' : 'ltr' }}>
        <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>TERMS OF SERVICE</p>
        <h1 style={{ fontSize: mounted && isMobile ? '32px' : '48px', fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          {isAr ? 'الشروط والأحكام' : 'Terms of Service'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '48px' }}>
          {isAr ? 'آخر تحديث: 18 يونيو 2026' : 'Last updated: June 18, 2026'}
        </p>

        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>{s.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 2 }}>{s.body}</p>
          </div>
        ))}
      </div>

      {(!mounted || !isMobile) && <Footer />}
      {mounted && isMobile && <MobileNav />}
    </main>
  );
}