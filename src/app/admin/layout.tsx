'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { icon: '🏠', label: 'الرئيسية', href: '/admin' },
  { icon: '🏢', label: 'المشاريع', href: '/admin/projects' },
  { icon: '📝', label: 'المدونة', href: '/admin/blog' },
  
  { icon: '⚙️', label: 'الإعدادات', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('arcom_admin');
    if (auth === 'true') setAuthed(true);
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@arcom.com', password }),
      });
      const data = await res.json();
      if (res.ok && data.role === 'superadmin') {
        localStorage.setItem('arcom_admin', 'true');
        setAuthed(true);
      } else {
        setError('كلمة المرور غلط');
      }
    } catch {
      setError('خطأ في الاتصال');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('arcom_admin');
    setAuthed(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontSize: '16px', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>
    </div>
  );

  if (!authed) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050A14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '48px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔐</div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 800, margin: 0 }}>لوحة التحكم</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginTop: '8px' }}>Arcom Developments</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontFamily: 'Cairo, sans-serif', outline: 'none', direction: 'rtl' }} />
          {error && <p style={{ color: '#ff4444', fontSize: '13px', textAlign: 'center', margin: 0 }}>{error}</p>}
          <button onClick={handleLogin} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>دخول</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050A14', fontFamily: 'Cairo, sans-serif', display: 'flex', direction: 'rtl' }}>
      <div style={{ width: '240px', backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 40 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#4A90D9', fontSize: '10px', letterSpacing: '3px', margin: '0 0 4px' }}>ARCOM</p>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: 800, margin: 0 }}>لوحة التحكم</h2>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', backgroundColor: pathname === item.href ? 'rgba(27,75,138,0.3)' : 'transparent', border: pathname === item.href ? '1px solid rgba(74,144,217,0.3)' : '1px solid transparent', color: pathname === item.href ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: pathname === item.href ? 700 : 400, transition: 'all 0.2s' }}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/ar" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '10px', textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px' }}>
            🌐 عرض الموقع
          </Link>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', fontSize: '13px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            🚪 تسجيل خروج
          </button>
        </div>
      </div>
      <div style={{ flex: 1, marginRight: '240px', minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}