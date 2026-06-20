'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';

export default function DataDeletionPage() {
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
        <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '5px', marginBottom: '16px' }}>DATA DELETION</p>
        <h1 style={{ fontSize: mounted && isMobile ? '32px' : '48px', fontWeight: 900, color: 'white', margin: '0 0 16px' }}>
          {isAr ? 'طلب حذف البيانات' : 'Data Deletion Request'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '48px' }}>
          {isAr ? 'آخر تحديث: 18 يونيو 2026' : 'Last updated: June 18, 2026'}
        </p>

        <div style={{ marginBottom: '36px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 2 }}>
            {isAr
              ? 'إذا قدّمت بياناتك (الاسم، رقم الهاتف، أو البريد الإلكتروني) من خلال موقعنا، الشات بوت، أو نموذج إعلان على فيسبوك أو إنستجرام أو جوجل، ويمكنك طلب حذف هذه البيانات نهائياً من أنظمتنا في أي وقت.'
              : 'If you submitted your data (name, phone number, or email) through our website, chatbot, or a Facebook, Instagram, or Google ad lead form, you can request permanent deletion of this data from our systems at any time.'}
          </p>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>
            {isAr ? 'كيفية تقديم طلب الحذف' : 'How to Submit a Deletion Request'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 2, marginBottom: '16px' }}>
            {isAr
              ? 'لطلب حذف بياناتك، يرجى التواصل معنا عبر أحد الطرق التالية مع ذكر رقم الهاتف أو البريد الإلكتروني المستخدم عند التواصل معنا:'
              : 'To request deletion of your data, please contact us through one of the following methods, mentioning the phone number or email you used when contacting us:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '14px', padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: '22px' }}>✉️</span>
              <div>
                <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '1px', marginBottom: '4px' }}>{isAr ? 'البريد الإلكتروني' : 'EMAIL'}</p>
                <p style={{ color: 'white', fontSize: '14px' }}>info@arcom.com</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', padding: '18px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: '22px' }}>💬</span>
              <div>
                <p style={{ color: '#25D366', fontSize: '11px', letterSpacing: '1px', marginBottom: '4px' }}>{isAr ? 'واتساب' : 'WHATSAPP'}</p>
                <a href="https://wa.me/201000000000" style={{ color: 'white', fontSize: '14px', textDecoration: 'none' }}>+20 100 000 0000</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>
            {isAr ? 'مدة تنفيذ الطلب' : 'Processing Time'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 2 }}>
            {isAr
              ? 'سيتم حذف بياناتك من قاعدة بيانات نظام إدارة العملاء (CRM) خلال 7 أيام عمل من تاريخ استلام الطلب، وسنؤكد لك إتمام الحذف عبر نفس وسيلة التواصل.'
              : 'Your data will be deleted from our CRM database within 7 business days of receiving the request, and we will confirm completion via the same contact method.'}
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '12px' }}>
            {isAr ? 'ملاحظة' : 'Note'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 2 }}>
            {isAr
              ? 'لمزيد من التفاصيل حول كيفية جمع واستخدام بياناتك، يرجى مراجعة سياسة الخصوصية الخاصة بنا.'
              : 'For more details on how we collect and use your data, please review our Privacy Policy.'}
          </p>
        </div>
      </div>

      {(!mounted || !isMobile) && <Footer />}
      {mounted && isMobile && <MobileNav />}
    </main>
  );
}