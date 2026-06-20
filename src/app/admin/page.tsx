'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ projects: 0, posts: 0 });

  useEffect(() => {
    const load = async () => {
      const [{ count: projects }, { count: posts }] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ projects: projects || 0, posts: posts || 0 });
    };
    load();
  }, []);

  return (
    <div style={{ padding: '40px', color: 'white' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>مرحباً 👋</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '40px' }}>لوحة تحكم Arcom Developments</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { icon: '🏢', label: 'المشاريع', value: stats.projects, color: '#1B4B8A', href: '/admin/projects' },
          { icon: '📝', label: 'المقالات', value: stats.posts, color: '#25D366', href: '/admin/blog' },
          { icon: '⚙️', label: 'الإعدادات', value: 'تعديل', color: '#C9A84C', href: '/admin/settings' },
        ].map(s => (
          <a key={s.label} href={s.href} style={{ textDecoration: 'none', padding: '32px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'block', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(74,144,217,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>{s.value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>{s.label}</div>
          </a>
        ))}
      </div>

      <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(27,75,138,0.1)', border: '1px solid rgba(27,75,138,0.2)' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', margin: 0 }}>
          💡 ابدأ بتعديل <a href="/admin/settings" style={{ color: '#4A90D9', textDecoration: 'none' }}>إعدادات الشركة</a> أو <a href="/admin/projects" style={{ color: '#4A90D9', textDecoration: 'none' }}>إضافة مشروع جديد</a>
        </p>
      </div>
    </div>
  );
}