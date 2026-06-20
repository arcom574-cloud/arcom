'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type SalesUser = { id: string; name: string; role: string; managed_by?: string; };
type Target = {
  id: string; user_id: string; month: string;
  target_amount: number; target_units: number; target_leads: number;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const monthLabel = (monthStr: string) => {
  const d = new Date(monthStr);
  return d.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
};

export default function TargetsPage() {
  const { locale, dir } = useCrmLocale();
  const [users, setUsers] = useState<SalesUser[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [editing, setEditing] = useState<Record<string, { amount: string; units: string; leads: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkUnits, setBulkUnits] = useState('');
  const [bulkLeads, setBulkLeads] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) {
      const u = JSON.parse(stored);
      setCurrentUser(u);
      if (u.role !== 'superadmin') window.location.href = '/crm';
    }
  }, []);

  const load = async () => {
    const { data: usersData } = await supabaseAdmin.from('crm_users').select('id, name, role, managed_by').eq('active', true).in('role', ['sales', 'admin']);
    if (usersData) setUsers(usersData);

    const { data: targetsData } = await supabaseAdmin.from('sales_targets').select('*').eq('month', selectedMonth);
    if (targetsData) setTargets(targetsData);
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedMonth]);

  const getTarget = (userId: string) => targets.find(t => t.user_id === userId);

  const handleSaveTarget = async (userId: string) => {
    const edit = editing[userId];
    if (!edit) return;
    setSaving(userId);

    const existing = getTarget(userId);
    const payload = {
      user_id: userId,
      month: selectedMonth,
      target_amount: +edit.amount || 0,
      target_units: +edit.units || 0,
      target_leads: +edit.leads || 0,
    };

    if (existing) {
      await supabaseAdmin.from('sales_targets').update(payload).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('sales_targets').insert(payload);
    }

    setSaving(null);
    setEditing(prev => { const next = { ...prev }; delete next[userId]; return next; });
    load();
  };

  const startEdit = (userId: string) => {
    const existing = getTarget(userId);
    setEditing(prev => ({
      ...prev,
      [userId]: {
        amount: String(existing?.target_amount || ''),
        units: String(existing?.target_units || ''),
        leads: String(existing?.target_leads || ''),
      }
    }));
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkApply = async () => {
    if (selectedUsers.size === 0) return;
    const payload = {
      month: selectedMonth,
      target_amount: +bulkAmount || 0,
      target_units: +bulkUnits || 0,
      target_leads: +bulkLeads || 0,
    };

    for (const userId of selectedUsers) {
      const existing = getTarget(userId);
      if (existing) {
        await supabaseAdmin.from('sales_targets').update(payload).eq('id', existing.id);
      } else {
        await supabaseAdmin.from('sales_targets').insert({ ...payload, user_id: userId });
      }
    }

    setBulkMode(false);
    setSelectedUsers(new Set());
    setBulkAmount(''); setBulkUnits(''); setBulkLeads('');
    load();
  };

  const inputStyle = {
    padding: '8px 12px', borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', width: '100px',
  };

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1 + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{locale === 'ar' ? 'أهداف السيلز (KPI)' : 'Sales Targets (KPI)'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{locale === 'ar' ? 'تحديد أهداف شهرية لكل سيلز وأدمن' : 'Set monthly targets for sales & admins'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...inputStyle, width: '160px', cursor: 'pointer' }}>
            {months.map(m => <option key={m} value={m} style={{ backgroundColor: '#0A0F1A' }}>{monthLabel(m)}</option>)}
          </select>
          <button onClick={() => setBulkMode(!bulkMode)} style={{ backgroundColor: bulkMode ? '#1B4B8A' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {bulkMode ? (locale === 'ar' ? 'إلغاء التحديد الجماعي' : 'Cancel Bulk') : (locale === 'ar' ? '📋 تحديد جماعي' : '📋 Bulk Set')}
          </button>
        </div>
      </div>

      {bulkMode && (
        <div style={{ backgroundColor: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.25)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '14px' }}>{locale === 'ar' ? 'حدد السيلز من القائمة تحت، وحدد الهدف اللي عاوزه يتفرض عليهم كلهم:' : 'Select sales from the list below, then set the target to apply to all of them:'}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={bulkAmount} onChange={e => setBulkAmount(e.target.value)} placeholder={locale === 'ar' ? 'هدف المبيعات (جنيه)' : 'Sales target (EGP)'} style={{ ...inputStyle, width: '170px' }} type="number" />
            <input value={bulkUnits} onChange={e => setBulkUnits(e.target.value)} placeholder={locale === 'ar' ? 'هدف الوحدات' : 'Units target'} style={{ ...inputStyle, width: '140px' }} type="number" />
            <input value={bulkLeads} onChange={e => setBulkLeads(e.target.value)} placeholder={locale === 'ar' ? 'هدف الليدز' : 'Leads target'} style={{ ...inputStyle, width: '130px' }} type="number" />
            <button onClick={handleBulkApply} disabled={selectedUsers.size === 0} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '9px 24px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
              {locale === 'ar' ? `تطبيق على ${selectedUsers.size} محدد` : `Apply to ${selectedUsers.size} selected`}
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {bulkMode && <th style={{ padding: '12px 16px', width: '40px' }}></th>}
              {(locale === 'ar' ? ['الاسم', 'الدور', 'هدف المبيعات (جنيه)', 'هدف الوحدات', 'هدف الليدز', 'إجراءات'] : ['Name', 'Role', 'Sales Target (EGP)', 'Units Target', 'Leads Target', 'Actions']).map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const target = getTarget(u.id);
              const isEditing = editing[u.id];
              return (
                <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  {bulkMode && (
                    <td style={{ padding: '14px 16px' }}>
                      <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleSelectUser(u.id)} />
                    </td>
                  )}
                  <td style={{ padding: '14px 16px', color: 'white', fontWeight: 600, fontSize: '14px' }}>{u.name}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ backgroundColor: u.role === 'admin' ? 'rgba(201,168,76,0.1)' : 'rgba(74,144,217,0.1)', border: `1px solid ${u.role === 'admin' ? 'rgba(201,168,76,0.3)' : 'rgba(74,144,217,0.3)'}`, borderRadius: '50px', padding: '3px 10px', color: u.role === 'admin' ? '#C9A84C' : '#4A90D9', fontSize: '11px' }}>
                      {u.role === 'admin' ? (locale === 'ar' ? 'أدمن' : 'Admin') : (locale === 'ar' ? 'سيلز' : 'Sales')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isEditing ? (
                      <input value={isEditing.amount} onChange={e => setEditing(prev => ({ ...prev, [u.id]: { ...prev[u.id], amount: e.target.value } }))} style={inputStyle} type="number" />
                    ) : (
                      <span style={{ color: '#00ff88', fontWeight: 700 }}>{target?.target_amount?.toLocaleString() || '-'}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isEditing ? (
                      <input value={isEditing.units} onChange={e => setEditing(prev => ({ ...prev, [u.id]: { ...prev[u.id], units: e.target.value } }))} style={{ ...inputStyle, width: '70px' }} type="number" />
                    ) : (
                      <span style={{ color: '#9B59B6', fontWeight: 700 }}>{target?.target_units || '-'}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isEditing ? (
                      <input value={isEditing.leads} onChange={e => setEditing(prev => ({ ...prev, [u.id]: { ...prev[u.id], leads: e.target.value } }))} style={{ ...inputStyle, width: '70px' }} type="number" />
                    ) : (
                      <span style={{ color: '#4A90D9', fontWeight: 700 }}>{target?.target_leads || '-'}</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleSaveTarget(u.id)} disabled={saving === u.id} style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>
                          {saving === u.id ? '...' : (locale === 'ar' ? '✓ حفظ' : '✓ Save')}
                        </button>
                        <button onClick={() => setEditing(prev => { const next = { ...prev }; delete next[u.id]; return next; })} style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>
                          {t('cancel', locale)}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(u.id)} style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>
                        ✏️ {target ? (locale === 'ar' ? 'تعديل' : 'Edit') : (locale === 'ar' ? 'تحديد هدف' : 'Set Target')}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>{locale === 'ar' ? 'لا يوجد مستخدمين' : 'No users'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}