'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { useBranch } from '@/lib/crm/useBranch';
import { t, getStatusLabel, getSourceLabel } from '@/lib/crm/translations';

type Lead = {
  id: string; name: string; phone: string; project_interest: string;
  source: string; status: string; budget: string; created_at: string;
  crm_users?: { name: string };
};

const columns = [
  { key: 'new', color: '#4A90D9', icon: '🆕' },
  { key: 'contacted', color: '#C9A84C', icon: '📞' },
  { key: 'meeting_scheduled', color: '#9B59B6', icon: '📅' },
  { key: 'site_visit', color: '#E67E22', icon: '🚗' },
  { key: 'negotiation', color: '#F39C12', icon: '🤝' },
  { key: 'contract', color: '#16A085', icon: '📝' },
  { key: 'closed_won', color: '#00ff88', icon: '🏆' },
  { key: 'closed_lost', color: '#ff4444', icon: '❌' },
];

export default function PipelinePage() {
  const { locale, dir } = useCrmLocale();
  const { branchFilter, refreshKey } = useBranch();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const statusLabels = getStatusLabel(locale);
  const sourceLabels = getSourceLabel(locale);

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('crm_user');
      const u = stored ? JSON.parse(stored) : null;
      if (!u) return;

      let query = supabaseAdmin.from('leads').select('*, crm_users(name)').order('created_at', { ascending: false });
      if (u.role === 'sales') query = query.eq('assigned_to', u.id);

      const stored2 = localStorage.getItem('crm_user');
      const u2 = stored2 ? JSON.parse(stored2) : null;
      if (u2?.role === 'superadmin' && branchFilter) {
        query = query.eq('branch_id', branchFilter);
      }

      const { data } = await query;
      if (data) setLeads(data);
      setLoading(false);
    };
    load();
  }, [refreshKey]);

  const handleDrop = async (status: string, leadId: string) => {
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;
    const label = statusLabels[status] || status;
    await supabaseAdmin.from('leads').update({ status }).eq('id', leadId);
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: leadId, user_id: u?.id, type: 'status_change',
      description: `تغيير الحالة إلى: ${label} (${t('pipeline', locale)})`,
    });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    setDragging(null);
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  const totalLeads = leads.length;

  return (
    <div style={{ padding: '30px 20px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px' }}>{t('pipeline', locale)}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '13px' }}>{t('drag_leads', locale)} · {totalLeads} {t('lead', locale)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '20px' }}>
        {columns.map(col => {
          const colLeads = leads.filter(l => l.status === col.key);
          return (
            <div key={col.key}
              style={{ minWidth: '200px', flex: '1 1 200px', maxWidth: '260px' }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (dragging) handleDrop(col.key, dragging); }}
            >
              {/* Column Header */}
              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: `${col.color}12`, border: `1px solid ${col.color}25`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>{col.icon}</span>
                  <span style={{ color: col.color, fontWeight: 700, fontSize: '12px' }}>{statusLabels[col.key]}</span>
                </div>
                <span style={{ backgroundColor: `${col.color}20`, border: `1px solid ${col.color}40`, borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: col.color, fontSize: '11px', fontWeight: 700 }}>
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
                {colLeads.map(lead => (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => setDragging(lead.id)}
                    onDragEnd={() => setDragging(null)}
                    style={{ padding: '12px', borderRadius: '10px', backgroundColor: dragging === lead.id ? 'rgba(74,144,217,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${dragging === lead.id ? 'rgba(74,144,217,0.4)' : 'rgba(255,255,255,0.07)'}`, cursor: 'grab', transition: 'all 0.2s' }}
                    onMouseEnter={e => { if (dragging !== lead.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                    onMouseLeave={e => { if (dragging !== lead.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
                  >
                    <a href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                      <h4 style={{ color: 'white', fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>{lead.name}</h4>
                    </a>
                    <p style={{ color: '#4A90D9', fontSize: '11px', margin: '0 0 4px', direction: 'ltr' }}>{lead.phone}</p>
                    {lead.project_interest && (
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', margin: '0 0 6px' }}>🏢 {lead.project_interest}</p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: '50px', padding: '2px 6px', color: '#4A90D9', fontSize: '9px' }}>
                        {sourceLabels[lead.source]}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>
                        {(lead.crm_users as any)?.name || '-'}
                      </span>
                    </div>
                    {/* Quick Actions */}
                    <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                      <a href={`/crm/leads/${lead.id}`} style={{ flex: 1, padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', color: '#4A90D9', textDecoration: 'none', fontSize: '10px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        📋 {t('details', locale)}
                      </a>
                      <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" style={{ flex: 1, padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', textDecoration: 'none', fontSize: '10px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        💬 {t('whatsapp', locale)}
                      </a>
                      <a href={`tel:${lead.phone}`} style={{ flex: 1, padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', textDecoration: 'none', fontSize: '10px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        📞 {t('call', locale)}
                      </a>
                    </div>
                  </div>
                ))}

                {colLeads.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                    {t('no_leads', locale)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}