'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { useBranch } from '@/lib/crm/useBranch';
import { t } from '@/lib/crm/translations';

type Call = {
  id: string; phone: string; duration: number; recording_url: string;
  notes: string; created_at: string;
  lead_id: string;
  crm_users?: { name: string };
  leads?: { name: string; phone: string };
};

export default function CallsPage() {
  const { locale, dir } = useCrmLocale();
  const { branchFilter, refreshKey } = useBranch();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('crm_user');
      const u = stored ? JSON.parse(stored) : null;
      if (!u) return;

      let query = supabaseAdmin
        .from('lead_calls')
        .select('*, crm_users(name), leads(name, phone)')
        .order('created_at', { ascending: false });

      if (u.role === 'sales') query = query.eq('user_id', u.id);

      const { data } = await query;
      const currentBranch = localStorage.getItem('crm_selected_branch');
      if (u.role === 'superadmin' && currentBranch && currentBranch !== 'all') {
        const { data: branchUsers } = await supabaseAdmin.from('crm_users').select('id').eq('branch_id', currentBranch);
        const branchUserIds = (branchUsers || []).map((bu: any) => bu.id);
        const filteredCalls = (data || []).filter((c: any) => branchUserIds.includes(c.user_id));
        setCalls(filteredCalls);
      } else {
        if (data) setCalls(data);
      }
      setLoading(false);
    };
    load();
  }, [refreshKey]);

  const filtered = calls.filter(c =>
    (c.leads as any)?.name?.includes(search) ||
    c.phone?.includes(search) ||
    (c.crm_users as any)?.name?.includes(search)
  );

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{t('calls', locale)}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{filtered.length} {locale === 'ar' ? 'مكالمة' : 'calls'}</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={locale === 'ar' ? '🔍 بحث باسم العميل أو التليفون' : '🔍 Search by client or phone'}
          style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif', outline: 'none', width: '280px' }}
        />
      </div>

      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {(locale === 'ar' ? ['العميل', 'التليفون', 'المدة', 'السيلز', 'ملاحظات', 'تسجيل', 'التاريخ'] : ['Client', 'Phone', 'Duration', 'Sales Rep', 'Notes', 'Recording', 'Date']).map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(call => (
              <tr key={call.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <td style={{ padding: '14px 16px' }}>
                  <Link href={`/crm/leads/${call.lead_id}`} style={{ color: 'white', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                    {(call.leads as any)?.name || '-'}
                  </Link>
                </td>
                <td style={{ padding: '14px 16px', color: '#4A90D9', fontSize: '13px', direction: 'ltr' }}>{call.phone}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: '50px', padding: '3px 10px', color: '#4A90D9', fontSize: '12px' }}>
                    {formatDuration(call.duration)}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  {(call.crm_users as any)?.name || '-'}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', maxWidth: '200px' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {call.notes || '-'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {call.recording_url ? (
                    <audio controls style={{ height: '28px', width: '160px' }}>
                      <source src={call.recording_url} />
                    </audio>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>لا يوجد</span>
                  )}
                </td>
                <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                  {call.created_at?.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📞</div>
                  لا يوجد مكالمات بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}