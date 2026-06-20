'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Logo from '@/components/website/Logo';
import LanguageSwitcher from '@/components/website/LanguageSwitcher';
import Footer from '@/components/website/Footer';
import MobileNav from '@/components/website/MobileNav';

export default function ContactPage() {
  const params = useParams();
  const locale = params.locale as string;
  const isAr = locale === 'ar';
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', project: '', message: '' });
  const [sent, setSent] = useState(false);

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
      gsap.fromTo('.contact-hero', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'power3.out' });
      gsap.fromTo('.contact-form', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' });
      gsap.fromTo('.contact-info', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.7, ease: 'power3.out' });
    };
    if (mounted) init();
  }, [mounted]);

  const handleSubmit = () => {
    const msg = `مرحباً، أنا ${form.name}%0Aرقم الهاتف: ${form.phone}%0Aالبريد: ${form.email}%0Aالمشروع: ${form.project}%0Aالرسالة: ${form.message}`;
    window.open(`https://wa.me/201000000000?text=${msg}`, '_blank');
    setSent(true);
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '14px',
    fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border 0.3s',
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#050A14', color: 'white', fontFamily: 'Cairo, sans-serif' }}>

      {(!mounted || !isMobile) && (
        <nav dir="ltr" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(5,10,20,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div style={{ width: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', direction: 'ltr' }}>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <Link href={`/${locale}`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'الرئيسية' : 'Home'}</Link>
              <Link href={`/${locale}/projects`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'المشاريع' : 'Projects'}</Link>
              <Link href={`/${locale}/about`} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '13px' }}>{isAr ? 'من نحن' : 'About'}</Link>
              <LanguageSwitcher locale={locale} compact />
              <a href="https://wa.me/201000000000" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '6px 18px', borderRadius: '50px', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>{isAr ? 'واتساب' : 'WhatsApp'}</a>
            </div>
            <Logo height={90} href={`/${locale}`} />
          </div>
        </nav>
      )}

      {/* Hero */}
      <div style={{ paddingTop: mounted && isMobile ? '60px' : '140px', textAlign: 'center', padding: mounted && isMobile ? '60px 24px 40px' : '140px 40px 60px', direction: 'rtl', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(27,75,138,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="contact-hero" style={{ opacity: 0 }}>
          <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '6px', marginBottom: '16px', fontWeight: 600 }}>CONTACT US</p>
          <h1 style={{ fontSize: mounted && isMobile ? '36px' : '64px', fontWeight: 900, color: 'white', margin: '0 0 16px', letterSpacing: '-2px' }}>
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px', maxWidth: '500px', margin: '0 auto' }}>
            {isAr ? 'فريقنا جاهز للإجابة على جميع استفساراتك' : 'Our team is ready to answer all your inquiries'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: mounted && isMobile ? '0 24px 120px' : '0 40px 80px', direction: 'rtl' }}>
        <div style={{ display: 'grid', gridTemplateColumns: mounted && isMobile ? '1fr' : '1fr 1fr', gap: '60px' }}>

          {/* Form */}
          <div className="contact-form" style={{ opacity: 0 }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '32px' }}>
              {isAr ? 'أرسل لنا رسالة' : 'Send Us a Message'}
            </h2>

            {sent ? (
              <div style={{ textAlign: 'center', padding: '60px 24px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
                  {isAr ? 'تم إرسال رسالتك!' : 'Message Sent!'}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {isAr ? 'سيتواصل معك فريقنا في أقرب وقت' : 'Our team will contact you soon'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(74,144,217,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    {isAr ? 'رقم الهاتف *' : 'Phone Number *'}
                  </label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+20 1XX XXX XXXX" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(74,144,217,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="example@email.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(74,144,217,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    {isAr ? 'المشروع المهتم به' : 'Project of Interest'}
                  </label>
                  <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ backgroundColor: '#050A14' }}>{isAr ? 'اختر المشروع' : 'Select Project'}</option>
                    <option value="al-nakhil" style={{ backgroundColor: '#050A14' }}>{isAr ? 'مشروع النخيل' : 'Al Nakhil'}</option>
                    <option value="business-tower" style={{ backgroundColor: '#050A14' }}>{isAr ? 'برج الأعمال' : 'Business Tower'}</option>
                    <option value="coastal-villas" style={{ backgroundColor: '#050A14' }}>{isAr ? 'فيلات الساحل' : 'Coastal Villas'}</option>
                    <option value="other" style={{ backgroundColor: '#050A14' }}>{isAr ? 'أخرى' : 'Other'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
                    {isAr ? 'رسالتك' : 'Your Message'}
                  </label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'} rows={4} style={{ ...inputStyle, resize: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(74,144,217,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <button onClick={handleSubmit} disabled={!form.name || !form.phone} style={{
                  backgroundColor: form.name && form.phone ? '#1B4B8A' : 'rgba(27,75,138,0.3)',
                  color: 'white', padding: '16px', borderRadius: '12px',
                  border: 'none', fontSize: '15px', fontWeight: 700,
                  cursor: form.name && form.phone ? 'pointer' : 'not-allowed',
                  fontFamily: 'Cairo, sans-serif', transition: 'all 0.3s',
                  boxShadow: form.name && form.phone ? '0 8px 32px rgba(27,75,138,0.4)' : 'none',
                }}>
                  💬 {isAr ? 'إرسال عبر واتساب' : 'Send via WhatsApp'}
                </button>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="contact-info" style={{ opacity: 0 }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '32px' }}>
              {isAr ? 'معلومات التواصل' : 'Contact Information'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
              {[
                { icon: '📍', titleAr: 'العنوان', titleEn: 'Address', valueAr: 'القاهرة الجديدة، مصر', valueEn: 'New Cairo, Egypt' },
                { icon: '📞', titleAr: 'الهاتف', titleEn: 'Phone', valueAr: '+20 100 000 0000', valueEn: '+20 100 000 0000' },
                { icon: '✉️', titleAr: 'البريد', titleEn: 'Email', valueAr: 'info@arcom.com', valueEn: 'info@arcom.com' },
                { icon: '🕐', titleAr: 'ساعات العمل', titleEn: 'Working Hours', valueAr: 'السبت - الخميس: 9ص - 6م', valueEn: 'Sat - Thu: 9AM - 6PM' },
              ].map(item => (
                <div key={item.titleAr} style={{ display: 'flex', gap: '16px', padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: '24px', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <p style={{ color: '#4A90D9', fontSize: '11px', letterSpacing: '2px', marginBottom: '4px' }}>{isAr ? item.titleAr : item.titleEn}</p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{isAr ? item.valueAr : item.valueEn}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>
              {isAr ? 'تابعنا على' : 'Follow Us'}
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[
                { icon: 'f', label: 'Facebook', color: '#1877F2', href: '#' },
                { icon: 'in', label: 'Instagram', color: '#E1306C', href: '#' },
                { icon: 'yt', label: 'YouTube', color: '#FF0000', href: '#' },
              ].map(s => (
                <a key={s.label} href={s.href} style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${s.color}20`; e.currentTarget.style.borderColor = s.color; e.currentTarget.style.color = s.color; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <a href="https://wa.me/201000000000" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px', padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', textDecoration: 'none', transition: 'all 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,211,102,0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(37,211,102,0.1)'}
            >
              <span style={{ fontSize: '28px' }}>💬</span>
              <div>
                <p style={{ color: '#25D366', fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>{isAr ? 'تواصل على واتساب' : 'Chat on WhatsApp'}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{isAr ? 'ردنا فوري' : 'Instant reply'}</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {(!mounted || !isMobile) && <Footer />}
      {mounted && isMobile && <MobileNav />}

    </main>
  );
}