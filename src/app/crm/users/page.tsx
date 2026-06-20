'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type User = {
  id: string; name: string; email: string; password: string;
  role: string; phone: string; active: boolean; created_at: string;
  managed_by?: string;
};

const emptyUser = { name: '', email: '', password: '', role: 'sales', phone: '', active: true, managed_by: '' };

export default function UsersPage() {
  const { locale, dir } = useCrmLocale();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyUser);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) {
      const u = JSON.parse(stored);
      setCurrentUser(u);
      if (u.role !== 'superadmin') window.location.href = '/crm';
    }
  }, []);

  const load = async () => {
    const { data } = await supabaseAdmin.from('crm_users').select('*').order('created_at');
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    const payload = { ...form, managed_by: form.managed_by || null };
    if (editing) {
      await supabaseAdmin.from('crm_users').update(payload).eq('id', editing.id);
    } else {
      await supabaseAdmin.from('crm_users').insert(payload);
    }
    setSaving(false);
    setShowAdd(false);
    setEditing(null);
    setForm(emptyUser);
    load();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    await supabaseAdmin.from('crm_users').update({ active: !active }).eq('id', id);
    load();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const roleLabel: Record<string, string> = locale === 'ar' ? { superadmin: 'سوبر أدمن', admin: 'أدمن', sales: 'سيلز' } : { superadmin: 'Super Admin', admin: 'Admin', sales: 'Sales' };
  const roleColor: Record<string, string> = { superadmin: '#ff4444', admin: '#C9A84C', sales: '#4A90D9' };

  const admins = users.filter(u => u.role === 'admin');
  const getManagerName = (managedBy?: string) => users.find(u => u.id === managedBy)?.name;

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{locale === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{users.length} {locale === 'ar' ? 'مستخدم' : 'users'}</p>
        </div>
        <button onClick={() => { setShowAdd(true); setEditing(null); setForm(emptyUser); }} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          {locale === 'ar' ? '+ إضافة مستخدم' : '+ Add User'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', opacity: u.active ? 1 : 0.5 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: `${roleColor[u.role]}20`, border: `2px solid ${roleColor[u.role]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {u.role === 'superadmin' ? '👑' : u.role === 'admin' ? '🛡️' : '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>{u.name}</h3>
                <span style={{ backgroundColor: `${roleColor[u.role]}20`, border: `1px solid ${roleColor[u.role]}40`, borderRadius: '50px', padding: '2px 10px', fontSize: '11px', color: roleColor[u.role] }}>
                  {roleLabel[u.role]}
                </span>
                {u.role === 'sales' && u.managed_by && (
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', padding: '2px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                    {locale === 'ar' ? `تابع لـ ${getManagerName(u.managed_by) || 'غير معروف'}` : `Managed by ${getManagerName(u.managed_by) || 'Unknown'}`}
                  </span>
                )}
                {!u.active && <span style={{ backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '50px', padding: '2px 10px', fontSize: '11px', color: '#ff4444' }}>{locale === 'ar' ? 'معطل' : 'Disabled'}</span>}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>{u.email} {u.phone && `· ${u.phone}`}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditing(u); setForm({ name: u.name, email: u.email, password: u.password, role: u.role, phone: u.phone || '', active: u.active, managed_by: u.managed_by || '' }); setShowAdd(true); }} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                {t('edit', locale)}
              </button>
              {u.id !== currentUser?.id && (
                <button onClick={() => handleToggleActive(u.id, u.active)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: u.active ? 'rgba(255,68,68,0.1)' : 'rgba(37,211,102,0.1)', border: `1px solid ${u.active ? 'rgba(255,68,68,0.3)' : 'rgba(37,211,102,0.3)'}`, color: u.active ? '#ff4444' : '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                  {u.active ? (locale === 'ar' ? '🚫 تعطيل' : '🚫 Disable') : (locale === 'ar' ? '✅ تفعيل' : '✅ Enable')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              {editing ? (locale === 'ar' ? 'تعديل مستخدم' : 'Edit User') : (locale === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'الاسم *' : 'Name *'}</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" style={{ ...inputStyle, direction: 'ltr' }} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'كلمة المرور *' : 'Password *'}</label>
                <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} type="text" style={{ ...inputStyle, direction: 'ltr' }} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'التليفون' : 'Phone'}</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ ...inputStyle, direction: 'ltr' }} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'الدور' : 'Role'}</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value, managed_by: e.target.value !== 'sales' ? '' : form.managed_by })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="sales" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'سيلز' : 'Sales'}</option>
                  <option value="admin" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'أدمن' : 'Admin'}</option>
                  <option value="superadmin" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'سوبر أدمن' : 'Super Admin'}</option>
                </select>
              </div>
              {form.role === 'sales' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'تابع لأدمن' : 'Managed by Admin'}</label>
                  <select value={form.managed_by} onChange={e => setForm({ ...form, managed_by: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'غير محدد' : 'Unassigned'}</option>
                    {admins.map(a => <option key={a.id} value={a.id} style={{ backgroundColor: '#0A0F1A' }}>{a.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} id="userActive" />
                <label htmlFor="userActive" style={{ color: 'white', cursor: 'pointer', fontSize: '13px' }}>{locale === 'ar' ? 'مستخدم نشط' : 'Active User'}</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { setShowAdd(false); setEditing(null); setForm(emptyUser); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.email || !form.password} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? t('saving', locale) : t('save', locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}