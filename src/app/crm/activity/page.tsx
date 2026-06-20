'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';
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
  leads?: { name: string };
};

const activityIcons: Record<string, string> = {
  comment: '\u{1F4AC}',
  call: '\u{1F4DE}',
  status_change: '\u{1F504}',
  transfer: '↔️',
  site_visit: '\u{1F697}',
  meeting: '\u{1F4C5}',
  whatsapp: '\u{1F4AC}',
  unit_sent: '\u{1F4E4}',
};

const activityLabels: Record<string, { ar: string; en: string }> = {
  comment: { ar: 'تعليق', en: 'Comment' },
  call: { ar: 'مكالمة', en: 'Call' },
  status_change: { ar: 'تغيير حالة', en: 'Status Change' },
  transfer: { ar: 'تحويل', en: 'Transfer' },
  site_visit: { ar: 'معاينة', en: 'Site Visit' },
  meeting: { ar: 'اجتماع', en: 'Meeting' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  unit_sent: { ar: 'إرسال وحدة', en: 'Unit Sent' },
};

function timeAgo(dateStr: string, locale: 'ar' | 'en'): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'ar' ? 'الآن' : 'Just now';
  if (mins < 60) return locale === 'ar' ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return locale === 'ar' ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return locale === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
}

export default function ActivityPage() {
  const { locale, dir } = useCrmLocale();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;
    if (!u) return;

    let query = supabaseAdmin
      .from('lead_activities')
      .select('*, crm_users(name), leads(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (u.role === 'sales') query = query.eq('user_id', u.id);
    if (filterType !== 'all') query = query.eq('type', filterType);

    const { data } = await query;
    if (data) setActivities(data);
    setLoading(false);
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = activities.filter(a => {
    if (!search) return true;
    const leadName = a.leads?.name || '';
    return leadName.toLowerCase().includes(search.toLowerCase());
  });

  const isAr = locale === 'ar';

  return (
    <div style={{ padding: '32px', direction: dir }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, margin: '0 0 4px' }}>
          {isAr ? 'سجل النشاط' : 'Activity Feed'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>
          {isAr ? 'كل الأنشطة في الـ CRM' : 'All CRM activities in real-time'}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={isAr ? '\u{1F50D} بحث باسم الليد...' : '\u{1F50D} Search by lead name...'}
          style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontFamily: 'Cairo, sans-serif', outline: 'none', minWidth: '220px', direction: dir }}
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '14px', fontFamily: 'Cairo, sans-serif', outline: 'none', cursor: 'pointer' }}
        >
          <option value="all">{isAr ? 'كل الأنواع' : 'All Types'}</option>
          {Object.keys(activityIcons).map(type => (
            <option key={type} value={type}>{activityIcons[type]} {activityLabels[type]?.[locale] || type}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '48px' }}>
          {t('loading', locale)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '48px', fontSize: '15px' }}>
          {isAr ? 'لا يوجد أنشطة' : 'No activities found'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map(activity => (
            <div key={activity.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px 20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px', transition: 'all 0.2s' }}>
              {/* Icon */}
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(74,144,217,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {activityIcons[activity.type] || '\u{1F4CB}'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span style={{ color: '#4A90D9', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: 'rgba(74,144,217,0.1)' }}>
                    {activityLabels[activity.type]?.[locale] || activity.type}
                  </span>
                  {activity.leads?.name && (
                    <Link href={`/crm/leads/${activity.lead_id}`} style={{ color: '#4A90D9', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
                      {activity.leads.name}
                    </Link>
                  )}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 4px', lineHeight: 1.5 }}>
                  {activity.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                  {activity.crm_users?.name && (
                    <span>{isAr ? 'بواسطة' : 'by'} {activity.crm_users.name}</span>
                  )}
                  <span>{timeAgo(activity.created_at, locale)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
