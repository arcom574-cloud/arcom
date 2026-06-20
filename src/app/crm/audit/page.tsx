'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type Activity = {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  description: string;
  created_at: string;
  crm_users?: { name: string };
  leads?: { name: string; phone: string };
};

const typeIcons: Record<string, string> = {
  comment: '💬',
  call: '📞',
  status_change: '🔄',
  transfer: '🔀',
  site_visit: '🚗',
  whatsapp: '💚',
};

const typeLabels: Record<string, { ar: string; en: string }> = {
  all: { ar: 'الكل', en: 'All' },
  comment: { ar: 'تعليق', en: 'Comment' },
  call: { ar: 'مكالمة', en: 'Call' },
  status_change: { ar: 'تغيير حالة', en: 'Status Change' },
  transfer: { ar: 'تحويل', en: 'Transfer' },
  site_visit: { ar: 'زيارة موقع', en: 'Site Visit' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
};

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const { locale, dir } = useCrmLocale();

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'superadmin') {
      window.location.href = '/crm';
      return;
    }
    loadActivities();
  }, [currentUser, filterType, search, page]);

  const loadActivities = async () => {
    setLoading(true);
    let query = supabaseAdmin
      .from('lead_activities')
      .select('*, crm_users(name), leads(name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    const { data, count } = await query;

    let filtered = data || [];
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        (a: Activity) => a.leads?.name?.toLowerCase().includes(s) || a.leads?.phone?.includes(s)
      );
    }

    setActivities(filtered);
    setTotalCount(count || 0);
    setLoading(false);
  };

  if (!currentUser || currentUser.role !== 'superadmin') {
    return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const inputStyle = {
    padding: '8px 18px',
    borderRadius: '50px',
    cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif',
    fontSize: '13px',
  };

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>
            {locale === 'ar' ? '📋 سجل العمليات' : '📋 Audit Log'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {totalCount} {locale === 'ar' ? 'عملية' : 'activities'}
          </p>
        </div>
        <Link href="/crm" style={{ ...inputStyle, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
          {locale === 'ar' ? '← الرجوع' : '← Back'}
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.keys(typeLabels).map(key => (
          <button
            key={key}
            onClick={() => { setFilterType(key); setPage(0); }}
            style={{
              ...inputStyle,
              backgroundColor: filterType === key ? '#1B4B8A' : 'rgba(255,255,255,0.05)',
              border: filterType === key ? '1px solid #4A90D9' : '1px solid rgba(255,255,255,0.1)',
              color: filterType === key ? 'white' : 'rgba(255,255,255,0.5)',
            }}
          >
            {typeIcons[key] || '📋'} {typeLabels[key][locale]}
          </button>
        ))}
        <input
          type="text"
          placeholder={locale === 'ar' ? 'بحث باسم الليد...' : 'Search by lead name...'}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          style={{
            padding: '8px 18px',
            borderRadius: '50px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '13px',
            outline: 'none',
            minWidth: '200px',
          }}
        />
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>{t('loading', locale)}</div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
          {locale === 'ar' ? 'لا توجد عمليات' : 'No activities found'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {activities.map(activity => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', flexShrink: 0,
              }}>
                {typeIcons[activity.type] || '📝'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>
                      {activity.crm_users?.name || '—'}
                    </span>
                    <span style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '50px',
                      backgroundColor: 'rgba(74,144,217,0.1)', color: '#4A90D9',
                    }}>
                      {typeLabels[activity.type]?.[locale] || activity.type}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(activity.created_at).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 6px', lineHeight: 1.5 }}>
                  {activity.description}
                </p>
                {activity.leads?.name && (
                  <Link
                    href={`/crm/leads/${activity.lead_id}`}
                    style={{ fontSize: '12px', color: '#4A90D9', textDecoration: 'none' }}
                  >
                    🔗 {activity.leads.name} {activity.leads.phone ? `(${activity.leads.phone})` : ''}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={{
              ...inputStyle,
              backgroundColor: page === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: page === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
            }}
          >
            {locale === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={{
              ...inputStyle,
              backgroundColor: page >= totalPages - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: page >= totalPages - 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
            }}
          >
            {locale === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
