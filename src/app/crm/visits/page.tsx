'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type Visit = {
  id: string; lead_id: string; project_id: string; user_id: string;
  visit_date: string; status: string; notes: string; result: string;
  created_at: string;
  leads?: { name: string; phone: string };
  projects?: { name_ar: string };
  crm_users?: { name: string };
};

const visitStatus: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'مجدول', color: '#4A90D9' },
  completed: { label: 'تمت', color: '#00ff88' },
  cancelled: { label: 'ملغي', color: '#ff4444' },
  no_show: { label: 'لم يحضر', color: '#888' },
};

export default function VisitsPage() {
  const { locale, dir } = useCrmLocale();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lead_id: '', project_id: '', user_id: '', visit_date: '', notes: '' });

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const load = async () => {
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;
    if (!u) return;

    let query = supabaseAdmin.from('site_visits').select('*, leads(name, phone), projects(name_ar), crm_users(name)').order('visit_date', { ascending: true });
    if (u.role === 'sales') query = query.eq('user_id', u.id);

    const { data } = await query;
    if (data) setVisits(data);

    const { data: projectsData } = await supabaseAdmin.from('projects').select('id, name_ar').eq('active', true);
    if (projectsData) setProjects(projectsData);

    let leadsQuery = supabaseAdmin.from('leads').select('id, name, phone').not('status', 'in', '("closed_won","closed_lost")');
    if (u.role === 'sales') leadsQuery = leadsQuery.eq('assigned_to', u.id);
    const { data: leadsData } = await leadsQuery;
    if (leadsData) setLeads(leadsData);

    if (u.role !== 'sales') {
      const { data: usersData } = await supabaseAdmin.from('crm_users').select('id, name, role').eq('active', true);
      if (usersData) setUsers(usersData);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.lead_id || !form.visit_date) return;
    setSaving(true);
    await supabaseAdmin.from('site_visits').insert({
      ...form,
      user_id: form.user_id || user?.id,
      status: 'scheduled',
    });
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: form.lead_id, user_id: user?.id, type: 'site_visit',
      description: `تم جدولة زيارة ميدانية: ${form.visit_date.replace('T', ' ')}`,
    });
    await supabaseAdmin.from('leads').update({ status: 'site_visit' }).eq('id', form.lead_id);
    setSaving(false);
    setShowAdd(false);
    setForm({ lead_id: '', project_id: '', user_id: '', visit_date: '', notes: '' });
    load();
  };

  const handleStatusChange = async (visitId: string, status: string, leadId: string) => {
    await supabaseAdmin.from('site_visits').update({ status }).eq('id', visitId);
    if (status === 'completed') {
      await supabaseAdmin.from('leads').update({ status: 'negotiation', last_contact_at: new Date().toISOString() }).eq('id', leadId);
      await supabaseAdmin.from('lead_activities').insert({
        lead_id: leadId, user_id: user?.id, type: 'site_visit',
        description: 'تمت الزيارة الميدانية بنجاح',
      });
    }
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayVisits = visits.filter(v => v.visit_date?.slice(0, 10) === today && v.status === 'scheduled');
  const upcomingVisits = visits.filter(v => v.visit_date?.slice(0, 10) > today && v.status === 'scheduled');
  const pastVisits = visits.filter(v => v.status !== 'scheduled');

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  const renderVisit = (visit: Visit) => (
    <div key={visit.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(230,126,34,0.12)', border: '1px solid rgba(230,126,34,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚗</div>
        <div>
          <a href={`/crm/leads/${visit.lead_id}`} style={{ fontSize: '14px', fontWeight: 700, color: 'white', textDecoration: 'none' }}>{(visit.leads as any)?.name}</a>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
            📍 {(visit.projects as any)?.name_ar || '-'} · 👤 {(visit.crm_users as any)?.name}
          </p>
          <p style={{ fontSize: '11px', color: '#E67E22', margin: '2px 0 0' }}>📅 {visit.visit_date?.slice(0, 16).replace('T', ' ')}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {visit.status === 'scheduled' && (
          <>
            <button onClick={() => handleStatusChange(visit.id, 'completed', visit.lead_id)} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>{locale === 'ar' ? 'تمت ✓' : 'Done ✓'}</button>
            <button onClick={() => handleStatusChange(visit.id, 'no_show', visit.lead_id)} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(136,136,136,0.1)', border: '1px solid rgba(136,136,136,0.3)', color: '#888', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>{locale === 'ar' ? 'لم يحضر' : 'No Show'}</button>
            <button onClick={() => handleStatusChange(visit.id, 'cancelled', visit.lead_id)} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>{t('cancel', locale)}</button>
          </>
        )}
        {visit.status !== 'scheduled' && (
          <span style={{ padding: '4px 12px', borderRadius: '50px', backgroundColor: `${visitStatus[visit.status]?.color}15`, border: `1px solid ${visitStatus[visit.status]?.color}30`, color: visitStatus[visit.status]?.color, fontSize: '11px' }}>
            {visitStatus[visit.status]?.label}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{locale === 'ar' ? 'المعاينات الميدانية' : 'Site Visits'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{locale === 'ar' ? 'جدولة ومتابعة زيارات العملاء للمشاريع' : 'Schedule and track client site visits'}</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          {locale === 'ar' ? '+ جدولة معاينة' : '+ Schedule Visit'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{locale === 'ar' ? 'معاينات اليوم' : "Today's Visits"}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#E67E22', margin: 0 }}>{todayVisits.length}</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{locale === 'ar' ? 'قادمة' : 'Upcoming'}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#4A90D9', margin: 0 }}>{upcomingVisits.length}</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{locale === 'ar' ? 'تمت' : 'Completed'}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#00ff88', margin: 0 }}>{pastVisits.filter(v => v.status === 'completed').length}</p>
        </div>
      </div>

      {/* Today */}
      {todayVisits.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#E67E22' }}>{locale === 'ar' ? '🔥 معاينات اليوم' : '🔥 Today\'s Visits'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{todayVisits.map(renderVisit)}</div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingVisits.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: '#4A90D9' }}>{locale === 'ar' ? '📅 المعاينات القادمة' : '📅 Upcoming Visits'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{upcomingVisits.map(renderVisit)}</div>
        </div>
      )}

      {/* Past */}
      {pastVisits.length > 0 && (
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'rgba(255,255,255,0.4)' }}>{locale === 'ar' ? 'السابقة' : 'Past'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{pastVisits.slice(0, 10).map(renderVisit)}</div>
        </div>
      )}

      {visits.length === 0 && <p style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>{locale === 'ar' ? 'لا يوجد معاينات مجدولة' : 'No visits scheduled'}</p>}

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>{locale === 'ar' ? 'جدولة معاينة جديدة' : 'Schedule New Visit'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'العميل *' : 'Client *'}</label>
                <select value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'اختر عميل' : 'Select Client'}</option>
                  {leads.map(l => <option key={l.id} value={l.id} style={{ backgroundColor: '#0A0F1A' }}>{l.name} - {l.phone}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'المشروع' : 'Project'}</label>
                <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'اختر مشروع' : 'Select Project'}</option>
                  {projects.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#0A0F1A' }}>{p.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'تاريخ ووقت المعاينة *' : 'Visit Date & Time *'}</label>
                <input type="datetime-local" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              {user?.role !== 'sales' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>السيلز المسؤول</label>
                  <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ backgroundColor: '#0A0F1A' }}>أنا</option>
                    {users.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#0A0F1A' }}>{u.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleSave} disabled={saving || !form.lead_id || !form.visit_date} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#E67E22', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? t('saving', locale) : locale === 'ar' ? '🚗 تأكيد المعاينة' : '🚗 Confirm Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
