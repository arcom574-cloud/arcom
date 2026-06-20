'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';

export default function PrivacyPolicyPage() {
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
    { title: 'مقدمة', body: 'تحترم Arcom Developments خصوصية زوار موقعنا والعملاء المحتملين. توضح هذه السياسة كيف نجمع المعلومات ونستخدمها ونحميها عند تواصلك معنا عبر الموقع، الشات بوت، أو نماذج الإعلانات على فيسبوك وإنستجرام وجوجل.' },
    { title: 'المعلومات التي نجمعها', body: 'نجمع الاسم، رقم الهاتف، البريد الإلكتروني (إن وجد)، والمشروع العقاري الذي تهتم به. قد تُجمع هذه المعلومات عبر نموذج التواصل في الموقع، محادثة الشات بوت، أو نماذج الليدز (Lead Forms) على فيسبوك وإنستجرام وجوجل أدز.' },
    { title: 'كيف نستخدم معلوماتك', body: 'نستخدم بياناتك للتواصل معك بخصوص استفسارك عن وحداتنا العقارية، تقديم عروض الأسعار، وترتيب زيارات ميدانية للمشاريع. لا نستخدم بياناتك لأي غرض تسويقي آخر دون موافقتك.' },
    { title: 'مشاركة المعلومات', body: 'لا نبيع أو نؤجر بياناتك الشخصية لأي طرف ثالث. قد تتم مشاركة بياناتك داخلياً مع فريق المبيعات المخصص للرد على استفسارك فقط.' },
    { title: 'تخزين البيانات وحمايتها', body: 'تُخزَّن بياناتك على خوادم آمنة (Supabase) مع تشفير وضوابط وصول مقيدة بأدوار الموظفين المخوّلين فقط (فريق المبيعات والإدارة).' },
    { title: 'حقوقك', body: 'يمكنك في أي وقت طلب الوصول إلى بياناتك، تعديلها، أو حذفها بالتواصل معنا عبر البريد الإلكتروني أو رقم الهاتف الموضح في صفحة التواصل. لمزيد من التفاصيل حول حذف البيانات، يرجى زيارة صفحة "حذف البيانات".' },
    { title: 'بيانات فيسبوك وجوجل أدز', body: 'عند تقديم بياناتك من خلال نموذج إعلان على فيسبوك، إنستجرام، أو جوجل، فإنك توافق على مشاركة هذه البيانات معنا لغرض التواصل بخصوص اهتمامك العقاري فقط، وفقاً لسياسات الخصوصية لهذه المنصات.' },
    { title: 'ملفات تعريف الارتباط (Cookies)', body: 'قد يستخدم موقعنا ملفات تعريف ارتباط أساسية لتحسين تجربة التصفح. لا نستخدم أدوات تتبع متقدمة لأغراض إعلانية خارجية.' },
    { title: 'التواصل معنا', body: 'لأي استفسار بخصوص هذه السياسة أو بياناتك الشخصية، يرجى التواصل معنا عبر صفحة "تواصل معنا".' },
  ];

  const sectionsEn = [
    { title: 'Introduction', body: 'Arcom Developments respects the privacy of our website visitors and prospective clients. This policy explains how we collect, use, and protect your information when you contact us through our website, chatbot, or lead forms on Facebook, Instagram, and Google Ads.' },
    { title: 'Information We Collect', body: 'We collect your name, phone number, email (if provided), and the real estate project you are interested in. This information may be collected through our website contact form, chatbot conversation, or Lead Forms on Facebook, Instagram, and Google Ads.' },
    { title: 'How We Use Your Information', body: 'We use your data to contact you regarding your inquiry about our real estate units, provide pricing information, and arrange site visits. We do not use your data for any other marketing purpose without your consent.' },
    { title: 'Sharing Your Information', body: 'We do not sell or rent your personal data to any third party. Your data may be shared internally only with the sales team assigned to respond to your inquiry.' },
    { title: 'Data Storage and Security', body: 'Your data is stored on secure servers (Supabase) with encryption and access restricted to authorized staff only (sales team and management).' },
    { title: 'Your Rights', body: 'You may request access to, correction of, or deletion of your data at any time by contacting us via the email or phone number listed on our Contact page. For more details on data deletion, please visit our Data Deletion page.' },
    { title: 'Facebook and Google Ads Data', body: 'When you submit your information through a Facebook, Instagram, or Google Ads lead form, you consent to sharing this data with us solely for the purpose of contacting you regarding your real estate interest, in accordance with the privacy policies of these platforms.' },
    { title: 'Cookies', body: 'Our website may use essential cookies to improve browsing experience. We do not use advanced tracking tools for external advertising purposes.' },
    { title: 'Contact Us', body: 'For any questions regarding this policy or your personal data, please contact us via our Contact page.' },
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
        <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>PRIVACY POLICY</p>
        <h1 style={{ fontSize: mounted && isMobile ? '32px' : '48px', fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
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