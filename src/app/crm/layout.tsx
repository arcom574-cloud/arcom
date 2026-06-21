'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import Notifications from '@/components/crm/Notifications';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';
import { BranchProvider, useBranchContext } from '@/lib/crm/BranchContext';

type User = {
  id: string; name: string; email: string; role: string;
};

const navItems = [
  { icon: '📊', key: 'home' as const, href: '/crm', roles: ['superadmin', 'admin', 'head_sales', 'sales'] },
  { icon: '👥', key: 'leads' as const, href: '/crm/leads', roles: ['superadmin', 'admin', 'head_sales', 'sales'] },
  { icon: '📋', key: 'pipeline' as const, href: '/crm/pipeline', roles: ['admin', 'head_sales', 'sales'] },
  { icon: '🏢', key: 'units' as const, href: '/crm/units', roles: ['superadmin', 'admin'] },
  { icon: '🎯', key: 'targets' as const, href: '/crm/targets', roles: ['superadmin'] },
  { icon: '🚗', key: 'visits' as const, href: '/crm/visits', roles: ['superadmin', 'admin', 'head_sales', 'sales'] },
  { icon: '📅', key: 'meetings' as const, href: '/crm/meetings', roles: ['superadmin', 'admin', 'head_sales', 'sales'] },
  { icon: '📞', key: 'calls' as const, href: '/crm/calls', roles: ['superadmin', 'admin', 'head_sales'] },
  { icon: '📈', key: 'reports' as const, href: '/crm/reports', roles: ['superadmin', 'admin', 'head_sales'] },
  { icon: '⚡', key: 'activity_feed' as const, href: '/crm/activity', roles: ['superadmin', 'admin', 'head_sales'] },
  { icon: '👤', key: 'users' as const, href: '/crm/users', roles: ['superadmin'] },
  { icon: '📚', key: 'knowledge' as const, href: '/crm/knowledge', roles: ['superadmin', 'admin', 'sales'] },
  { icon: '🔍', key: 'audit_log' as const, href: '/crm/audit', roles: ['superadmin'] },
  { icon: '⚙️', key: 'settings' as const, href: '/crm/settings', roles: ['superadmin'] },
];

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, toggleLocale, isAr, dir } = useCrmLocale();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranchState] = useState('all');

  useEffect(() => {
    const loadBranches = async () => {
      const stored = localStorage.getItem('crm_user');
      if (!stored) return;
      const u = JSON.parse(stored);
      if (u.role === 'superadmin') {
        const { data } = await supabaseAdmin.from('branches').select('*').order('created_at');
        if (data) setBranches(data);
        const saved = localStorage.getItem('crm_selected_branch');
        if (saved) setSelectedBranchState(saved);
      }
    };
    loadBranches();
  }, []);

  const setSelectedBranch = (id: string) => {
    setSelectedBranchState(id);
    localStorage.setItem('crm_selected_branch', id);
    window.dispatchEvent(new Event('branch-changed'));
  };
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('crm_user', JSON.stringify(data));
        setUser(data);
        setError('');
      } else {
        setError(data.error || 'البريد الإلكتروني أو كلمة المرور غلط');
      }
    } catch {
      setError('خطأ في الاتصال');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    setUser(null);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '420px', padding: '48px', borderRadius: '24px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/logo.png" alt="Arcom" style={{ height: '80px', objectFit: 'contain', marginBottom: '16px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>{t('login', locale)}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{t('email', locale)}</label>
            <input value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} type="email" placeholder="admin@arcom.com" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' as const, direction: 'ltr' }} />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', display: 'block', marginBottom: '6px' }}>{t('password', locale)}</label>
            <input value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} type="password" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontFamily: 'Cairo, sans-serif', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          {error && <p style={{ color: '#ff4444', fontSize: '13px', textAlign: 'center', margin: 0 }}>{error}</p>}
          <button onClick={handleLogin} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {t('loginBtn', locale)}
          </button>
        </div>
      </div>
    </div>
  );

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0F1A', fontFamily: 'Cairo, sans-serif', display: 'flex', direction: dir }}>

      {/* Mobile hamburger button */}
      {isMobile && !sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} style={{ position: 'fixed', top: '16px', [isAr ? 'right' : 'left']: '16px', zIndex: 45, backgroundColor: '#1B4B8A', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '12px', cursor: 'pointer', fontSize: '20px' }}>☰</button>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 39 }} />
      )}

      {/* Sidebar */}
      <div style={{ width: '240px', backgroundColor: isMobile ? '#0A0F1A' : 'rgba(255,255,255,0.02)', borderLeft: isAr ? '1px solid rgba(255,255,255,0.06)' : 'none', borderRight: isAr ? 'none' : '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, [isAr ? 'right' : 'left']: 0, bottom: 0, zIndex: 40, ...(isMobile ? { transform: sidebarOpen ? 'translateX(0)' : (isAr ? 'translateX(100%)' : 'translateX(-100%)'), transition: 'transform 0.3s ease' } : {}) }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <img src="/logo.png" alt="Arcom" style={{ height: '50px', objectFit: 'contain' }} />
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {filteredNav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => isMobile && setSidebarOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', textDecoration: 'none', backgroundColor: pathname === item.href ? 'rgba(27,75,138,0.3)' : 'transparent', border: pathname === item.href ? '1px solid rgba(74,144,217,0.3)' : '1px solid transparent', color: pathname === item.href ? 'white' : 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: pathname === item.href ? 700 : 400, transition: 'all 0.2s' }}>
              <span>{item.icon}</span>
              <span>{t(item.key, locale)}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Branch Selector */}
          {user?.role === 'superadmin' && branches.length > 0 && (
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ width: '100%', background: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.25)', borderRadius: '10px', color: '#9B59B6', padding: '8px 12px', fontSize: '12px', fontWeight: 700, fontFamily: 'Cairo, sans-serif', outline: 'none', cursor: 'pointer' }}>
              <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{isAr ? '🏢 كل الفروع' : '🏢 All Branches'}</option>
              {branches.map(b => <option key={b.id} value={b.id} style={{ backgroundColor: '#0A0F1A' }}>🏢 {b.name}</option>)}
            </select>
          )}

          {/* Controls Row */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={toggleLocale} style={{ flex: 1, background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: '10px', color: '#4A90D9', cursor: 'pointer', padding: '8px', fontSize: '12px', fontWeight: 700, fontFamily: 'Cairo, sans-serif' }}>
              {isAr ? 'EN' : 'عربي'}
            </button>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px' }}>
              <Notifications />
            </div>
          </div>

          {/* User Info */}
          <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>{user.name}</p>
            <p style={{ color: '#4A90D9', fontSize: '11px', margin: 0 }}>{t(user.role as any, locale)}</p>
          </div>

          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', fontSize: '12px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            🚪 {t('logout', locale)}
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, [isAr ? 'marginRight' : 'marginLeft']: isMobile ? '0px' : '240px', minHeight: '100vh', ...(isMobile ? { paddingTop: '60px' } : {}) }}>
        {children}
      </div>
    </div>
  );
}