'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t, getStatusLabel, getSourceLabel } from '@/lib/crm/translations';
import { useBranch } from '@/lib/crm/useBranch';


type Lead = {
  id: string; name: string; phone: string; email: string;
  project_interest: string; source: string; status: string;
  assigned_to: string; budget: string; notes: string;
  deal_value: number; unit_type: string; project_id: string;
  created_at: string; crm_users?: { name: string }; projects?: { name_ar: string };
};

type User = { id: string; name: string; role: string; managed_by?: string; };
type Project = { id: string; name_ar: string; slug: string; active: boolean; };

const statusColor: Record<string, string> = {
  new: '#4A90D9', contacted: '#C9A84C', meeting_scheduled: '#9B59B6',
  site_visit: '#E67E22', negotiation: '#F39C12', contract: '#16A085',
  closed_won: '#00ff88', closed_lost: '#ff4444', postponed: '#888', interested: '#25D366',
};

const statusLabel: Record<string, string> = {
  new: 'جديد', contacted: 'تم التواصل', meeting_scheduled: 'موعد محدد',
  site_visit: 'زيارة ميدانية', negotiation: 'تفاوض', contract: 'عقد',
  closed_won: 'تم البيع', closed_lost: 'فاقد', postponed: 'مؤجل', interested: 'مهتم',
};

const sourceLabel: Record<string, string> = {
  manual: 'يدوي', website: 'موقع', facebook: 'فيسبوك',
  whatsapp: 'واتساب', google: 'جوجل', chatbot: '🤖 شات بوت',
};

const sourceColor: Record<string, string> = {
  manual: '#888', website: '#4A90D9', facebook: '#1877F2',
  whatsapp: '#25D366', google: '#EA4335', chatbot: '#ff6400',
};

const unitTypeLabel: Record<string, string> = {
  shop: 'محل', office: 'مكتب إداري', cafe: 'كافيه/مطعم',
};

const emptyLead = {
  name: '', phone: '', email: '', project_interest: '', project_id: '',
  source: 'manual', status: 'new', assigned_to: '',
  budget: '', notes: '', deal_value: 0, unit_type: '',
};

export default function LeadsPage() {
  const { locale, dir } = useCrmLocale();
  const { branchFilter, refreshKey } = useBranch();
  const statusLabels = getStatusLabel(locale);
  const sourceLabels = getSourceLabel(locale);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [callCounts, setCallCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyLead);
  const [saving, setSaving] = useState(false);
  const [showTransfer, setShowTransfer] = useState<string | null>(null);
  const [transferTo, setTransferTo] = useState('');
  const [hideComments, setHideComments] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [bulkTransferTo, setBulkTransferTo] = useState('');
  const [bulkCount, setBulkCount] = useState('');
  const [bulkSourceFilter, setBulkSourceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const load = async () => {
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;
    if (!u) return;

    let query = supabaseAdmin.from('leads').select('*, crm_users(name), projects(name_ar)').order('created_at', { ascending: false });

    if (u.role === 'sales') {
      query = query.eq('assigned_to', u.id);
    } else if (u.role === 'admin') {
      const { data: teamMembers } = await supabaseAdmin.from('crm_users').select('id').eq('managed_by', u.id);
      const teamIds = [u.id, ...(teamMembers || []).map((t: any) => t.id)];
      query = query.in('assigned_to', teamIds);
    } else if (u.role === 'superadmin') {
      const currentBranch = localStorage.getItem('crm_selected_branch');
      if (currentBranch && currentBranch !== 'all') {
        query = query.eq('branch_id', currentBranch);
      }
    }

    const { data } = await query;
    if (data) setLeads(data);

    if (u.role !== 'sales') {
      let usersQuery = supabaseAdmin.from('crm_users').select('id, name, role, managed_by').eq('active', true);
      if (u.role === 'admin') usersQuery = usersQuery.eq('managed_by', u.id);
      const { data: usersData } = await usersQuery;
      if (usersData) setUsers(usersData);
    }

    const { data: projectsData } = await supabaseAdmin.from('projects').select('id, name_ar, slug, active').eq('active', true).order('order_num');
    if (projectsData) setProjects(projectsData);

    const { data: callsData } = await supabaseAdmin.from('lead_calls').select('lead_id');
    if (callsData) {
      const counts: Record<string, number> = {};
      callsData.forEach((c: any) => { counts[c.lead_id] = (counts[c.lead_id] || 0) + 1; });
      setCallCounts(counts);
    }

    const { data: commentsData } = await supabaseAdmin.from('lead_comments').select('lead_id');
    if (commentsData) {
      const counts: Record<string, number> = {};
      commentsData.forEach((c: any) => { counts[c.lead_id] = (counts[c.lead_id] || 0) + 1; });
      setCommentCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const handleAdd = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;
    await supabaseAdmin.from('leads').insert({ ...form, assigned_to: form.assigned_to || null, branch_id: u?.branch_id || null });
    setSaving(false);
    setShowAdd(false);
    setForm(emptyLead);
    load();
  };

  const handleTransfer = async (leadId: string) => {
    if (!transferTo) return;
    await supabaseAdmin.from('leads').update({ assigned_to: transferTo }).eq('id', leadId);
    if (hideComments) {
      await supabaseAdmin.from('lead_comments').update({ visible: false }).eq('lead_id', leadId);
    }
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: leadId, user_id: user?.id,
      type: 'transfer', description: `تم تحويل الليد${hideComments ? ' وإخفاء التعليقات السابقة' : ''}`,
    });
    setShowTransfer(null);
    setTransferTo('');
    setHideComments(false);
    load();
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    await supabaseAdmin.from('leads').update({ status, last_contact_at: new Date().toISOString() }).eq('id', leadId);
    load();
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkTransferSelected = async () => {
    if (!transferTo || selectedLeads.size === 0) return;
    for (const leadId of selectedLeads) {
      await supabaseAdmin.from('leads').update({ assigned_to: transferTo }).eq('id', leadId);
    }
    await supabaseAdmin.from('lead_activities').insert(
      Array.from(selectedLeads).map(leadId => ({
        lead_id: leadId, user_id: user?.id, type: 'transfer', description: 'تحويل جماعي',
      }))
    );
    setSelectedLeads(new Set());
    setShowTransfer(null);
    setTransferTo('');
    load();
  };

  const getTeamMembers = () => {
    if (user?.role === 'superadmin') return users.filter(u => u.role === 'sales' || u.role === 'admin');
    if (user?.role === 'admin') return users.filter(u => u.managed_by === user.id);
    return [];
  };

  const handleBulkAssignByCount = async () => {
    const count = parseInt(bulkCount);
    if (!count || !bulkTransferTo) return;

    let query = supabaseAdmin.from('leads').select('id').is('assigned_to', null).order('created_at', { ascending: true }).limit(count);
    if (bulkSourceFilter !== 'all') query = query.eq('source', bulkSourceFilter);

    const { data: unassignedLeads } = await query;
    if (!unassignedLeads || unassignedLeads.length === 0) return;

    const ids = unassignedLeads.map((l: any) => l.id);
    await supabaseAdmin.from('leads').update({ assigned_to: bulkTransferTo }).in('id', ids);
    await supabaseAdmin.from('lead_activities').insert(
      ids.map((leadId: string) => ({
        lead_id: leadId, user_id: user?.id, type: 'transfer', description: `تخصيص جماعي تلقائي (${count} ليد)`,
      }))
    );

    setShowBulkTransfer(false);
    setBulkCount('');
    setBulkTransferTo('');
    setBulkSourceFilter('all');
    load();
  };

  const handleAutoDistribute = async () => {
    const team = getTeamMembers();
    if (team.length === 0) return;

    let query = supabaseAdmin.from('leads').select('id').is('assigned_to', null).order('created_at', { ascending: true });
    if (bulkSourceFilter !== 'all') query = query.eq('source', bulkSourceFilter);

    const { data: unassignedLeads } = await query;
    if (!unassignedLeads || unassignedLeads.length === 0) return;

    for (let i = 0; i < unassignedLeads.length; i++) {
      const assignTo = team[i % team.length];
      await supabaseAdmin.from('leads').update({ assigned_to: assignTo.id }).eq('id', unassignedLeads[i].id);
    }

    await supabaseAdmin.from('lead_activities').insert(
      unassignedLeads.map((l: any, i: number) => ({
        lead_id: l.id, user_id: user?.id, type: 'transfer',
        description: locale === 'ar' ? `توزيع تلقائي بالتساوي على ${team.length} سيلز` : `Auto-distributed equally among ${team.length} reps`,
      }))
    );

    setShowBulkTransfer(false);
    setBulkSourceFilter('all');
    load();
  };

  const duplicatePhones = new Set<string>();
  const phoneCounts: Record<string, number> = {};
  for (const l of leads) {
    if (!l.phone) continue;
    const normalized = l.phone.replace(/\D/g, '');
    phoneCounts[normalized] = (phoneCounts[normalized] || 0) + 1;
  }
  for (const [phone, count] of Object.entries(phoneCounts)) {
    if (count > 1) duplicatePhones.add(phone);
  }
  const isDuplicate = (lead: Lead) => lead.phone && duplicatePhones.has(lead.phone.replace(/\D/g, ''));

  const calcLeadScore = (lead: Lead) => {
    let score = 0;

    // بيانات العميل (20 نقطة)
    if (lead.phone) score += 5;
    if (lead.email) score += 5;
    if (lead.project_id) score += 5;
    if (lead.budget) score += 5;

    // المرحلة (35 نقطة)
    const statusScores: Record<string, number> = {
      new: 0, contacted: 5, interested: 10, meeting_scheduled: 15,
      site_visit: 20, negotiation: 25, contract: 30, closed_won: 35,
    };
    score += statusScores[lead.status] || 0;

    // التفاعلات (30 نقطة)
    const calls = callCounts[lead.id] || 0;
    const comments = commentCounts[lead.id] || 0;
    score += Math.min(calls * 5, 15); // كل مكالمة 5 نقط، حد أقصى 15
    score += Math.min(comments * 3, 15); // كل تعليق 3 نقط، حد أقصى 15

    // آخر تواصل (10 نقط)
    if ((lead as any).last_contact_at) {
      const daysSince = Math.floor((Date.now() - new Date((lead as any).last_contact_at).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince <= 1) score += 10;
      else if (daysSince <= 3) score += 7;
      else if (daysSince <= 7) score += 3;
    }

    // المصدر (5 نقط)
    if (lead.source === 'facebook' || lead.source === 'google') score += 5;

    return Math.min(score, 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#00ff88';
    if (score >= 40) return '#F39C12';
    return '#ff4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return t('hot', locale);
    if (score >= 40) return t('warm', locale);
    return t('cold', locale);
  };

  const isFromChatbot = (lead: Lead) => lead.source === 'chatbot' || lead.notes?.includes('شات بوت');

  const filtered = leads.filter(l => {
    const matchSearch = l.name.includes(search) || l.phone.includes(search);
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    const matchSource = filterSource === 'all' || l.source === filterSource;
    const matchProject = filterProject === 'all' || l.project_id === filterProject;
    return matchSearch && matchStatus && matchSource && matchProject;
  });

  const handleExportExcel = () => {
    const data = filtered.map(l => ({
      'الاسم': l.name,
      'التليفون': l.phone,
      'الإيميل': l.email,
      'المشروع': (l.projects as any)?.name_ar || l.project_interest || '',
      'نوع الوحدة': unitTypeLabel[l.unit_type] || l.unit_type || '',
      'القيمة': l.deal_value || 0,
      'المصدر': sourceLabel[l.source] || l.source,
      'الحالة': statusLabel[l.status] || l.status,
      'المسؤول': (l.crm_users as any)?.name || 'غير محدد',
      'تاريخ الإضافة': l.created_at?.slice(0, 10),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الليدز');
    XLSX.writeFile(wb, `leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedLeads = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <style>{`
        @keyframes chatbotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,100,0,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(255,100,0,0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{t('leads', locale)}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{filtered.length} {t('lead', locale)}</p>
            {filtered.filter(isFromChatbot).length > 0 && (
              <span style={{ backgroundColor: 'rgba(255,100,0,0.15)', border: '1px solid rgba(255,100,0,0.4)', borderRadius: '50px', padding: '3px 12px', fontSize: '12px', color: '#ff6400', fontWeight: 700 }}>
                🔥 {filtered.filter(isFromChatbot).length} {t('from_chatbot', locale)}
              </span>
            )}
            {filtered.filter(isDuplicate).length > 0 && (user?.role === 'superadmin' || user?.role === 'admin') && (
              <span style={{ backgroundColor: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)', borderRadius: '50px', padding: '3px 12px', fontSize: '12px', color: '#FF3B30', fontWeight: 700 }}>
                ⚠ {filtered.filter(isDuplicate).length} {t('duplicate_count', locale)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <button onClick={() => setShowBulkTransfer(true)} style={{ backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
              {t('bulk_assign', locale)}
            </button>
          )}
          {selectedLeads.size > 0 && (
            <button onClick={() => setShowTransfer('bulk')} style={{ backgroundColor: 'rgba(74,144,217,0.15)', border: '1px solid rgba(74,144,217,0.4)', color: '#4A90D9', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
              تحويل المحدد ({selectedLeads.size})
            </button>
          )}
          {user?.role !== 'sales' && (
            <>
              <button onClick={handleExportExcel} style={{ backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                {t('export_excel', locale)}
              </button>
              <a href="/crm/leads/import" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {t('import_file', locale)}
              </a>
            </>
          )}
          <button onClick={() => setShowAdd(true)} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {t('add_lead', locale)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search_placeholder', locale)} style={{ ...inputStyle, width: '240px' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: '170px', cursor: 'pointer' }}>
          <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{t('all_statuses', locale)}</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ ...inputStyle, width: '160px', cursor: 'pointer' }}>
          <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{t('all_sources', locale)}</option>
          {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...inputStyle, width: '180px', cursor: 'pointer' }}>
          <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{t('all_projects', locale)}</option>
          {projects.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#0A0F1A' }}>{p.name_ar}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {(user?.role === 'superadmin' || user?.role === 'admin') && <th style={{ padding: '12px 10px', width: '36px' }}></th>}
              {[t('name', locale), t('project', locale), 'Score', t('source', locale), t('status', locale), t('last_contact', locale), ...(user?.role === 'superadmin' ? [locale === 'ar' ? 'الأدمن' : 'Admin', locale === 'ar' ? 'السيلز' : 'Sales Rep'] : [locale === 'ar' ? 'السيلز' : 'Sales Rep']), t('actions', locale)].map(h => (
                <th key={h} style={{ padding: '12px 10px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map(lead => {
              const score = calcLeadScore(lead);
              const lastContact = (lead as any).last_contact_at;
              const daysSince = lastContact ? Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)) : null;
              const calls = callCounts[lead.id] || 0;
              const comments = commentCounts[lead.id] || 0;

              return (
              <tr key={lead.id}
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', backgroundColor: isDuplicate(lead) ? 'rgba(255,59,48,0.06)' : isFromChatbot(lead) ? 'rgba(255,100,0,0.04)' : 'transparent', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDuplicate(lead) ? 'rgba(255,59,48,0.1)' : isFromChatbot(lead) ? 'rgba(255,100,0,0.08)' : 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isDuplicate(lead) ? 'rgba(255,59,48,0.06)' : isFromChatbot(lead) ? 'rgba(255,100,0,0.04)' : 'transparent'}
              >
                {(user?.role === 'superadmin' || user?.role === 'admin') && (
                  <td style={{ padding: '10px' }}>
                    <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => toggleSelectLead(lead.id)} />
                  </td>
                )}
                {/* الاسم + التليفون + badges */}
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <a href={`/crm/leads/${lead.id}`} style={{ color: 'white', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}>{lead.name}</a>
                    {isFromChatbot(lead) && (
                      <span style={{ backgroundColor: 'rgba(255,100,0,0.2)', border: '1px solid rgba(255,100,0,0.5)', borderRadius: '50px', padding: '2px 8px', fontSize: '9px', color: '#ff6400', fontWeight: 700, animation: 'chatbotPulse 2s ease-in-out infinite' }}>🔥 {t('chatbot', locale)}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <a href={`tel:${lead.phone}`} style={{ color: isDuplicate(lead) ? '#FF3B30' : '#4A90D9', fontSize: '11px', textDecoration: 'none', direction: 'ltr', fontWeight: isDuplicate(lead) ? 700 : 400 }}>{lead.phone}</a>
                    {isDuplicate(lead) && <span style={{ fontSize: '9px', color: '#FF3B30', fontWeight: 700 }}>⚠ مكرر</span>}
                  </div>
                  {(lead.deal_value > 0 || lead.budget) && (
                    <p style={{ fontSize: '10px', color: '#C9A84C', margin: '2px 0 0' }}>💰 {lead.deal_value > 0 ? `${lead.deal_value.toLocaleString()} ج` : lead.budget}</p>
                  )}
                </td>
                {/* المشروع */}
                <td style={{ padding: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                  {(lead.projects as any)?.name_ar || lead.project_interest || '-'}
                </td>
                {/* Score */}
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: `${getScoreColor(score)}15`, border: `2px solid ${getScoreColor(score)}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: getScoreColor(score) }}>{score}</div>
                    <div>
                      <span style={{ fontSize: '9px', color: getScoreColor(score), display: 'block' }}>{getScoreLabel(score)}</span>
                      {(calls > 0 || comments > 0) && (
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>{calls > 0 ? `📞${calls}` : ''} {comments > 0 ? `💬${comments}` : ''}</span>
                      )}
                    </div>
                  </div>
                </td>
                {/* المصدر */}
                <td style={{ padding: '10px' }}>
                  <span style={{ backgroundColor: `${sourceColor[lead.source] || '#4A90D9'}15`, border: `1px solid ${sourceColor[lead.source] || '#4A90D9'}40`, borderRadius: '50px', padding: '2px 8px', color: sourceColor[lead.source] || '#4A90D9', fontSize: '10px', fontWeight: lead.source === 'chatbot' ? 700 : 400 }}>
                    {sourceLabels[lead.source] || lead.source}
                  </span>
                </td>
                {/* الحالة */}
                <td style={{ padding: '10px' }}>
                  <select value={lead.status} onChange={e => handleStatusChange(lead.id, e.target.value)} style={{ backgroundColor: `${statusColor[lead.status]}20`, border: `1px solid ${statusColor[lead.status]}40`, borderRadius: '50px', padding: '3px 8px', color: statusColor[lead.status], fontSize: '10px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', outline: 'none' }}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A', color: 'white' }}>{v}</option>)}
                  </select>
                </td>
                {/* آخر تواصل */}
                <td style={{ padding: '10px' }}>
                  {lastContact ? (
                    <div>
                      <span style={{ fontSize: '11px', color: daysSince !== null && daysSince > 3 ? '#ff4444' : daysSince !== null && daysSince > 1 ? '#F39C12' : '#25D366', fontWeight: 600 }}>
                        {daysSince === 0 ? t('today', locale) : daysSince === 1 ? t('yesterday', locale) : `${daysSince} يوم`}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{t('not_done', locale)}</span>
                  )}
                </td>
                {/* الأدمن (superadmin only) */}
                {user?.role === 'superadmin' && (
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {(() => {
                      const assignedUser = users.find(u => u.id === lead.assigned_to);
                      if (!assignedUser) return <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span>;
                      if (assignedUser.role === 'admin') return <span style={{ color: '#9B59B6', fontWeight: 600 }}>{assignedUser.name}</span>;
                      const adminUser = users.find(u => u.id === assignedUser.managed_by);
                      return adminUser ? <span style={{ color: '#9B59B6' }}>{adminUser.name}</span> : <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span>;
                    })()}
                  </td>
                )}
                {/* السيلز */}
                <td style={{ padding: '10px', fontSize: '12px' }}>
                  {(() => {
                    const assignedUser = users.find(u => u.id === lead.assigned_to);
                    if (!assignedUser) return <span style={{ color: 'rgba(255,255,255,0.2)' }}>-</span>;
                    if (assignedUser.role === 'sales') return <span style={{ color: '#4A90D9' }}>{assignedUser.name}</span>;
                    return <span style={{ color: 'rgba(255,255,255,0.4)' }}>{assignedUser.name}</span>;
                  })()}
                </td>
                {/* إجراءات */}
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <a href={`/crm/leads/${lead.id}`} style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', color: '#4A90D9', textDecoration: 'none', fontSize: '10px' }}>{t('details', locale)}</a>
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', textDecoration: 'none', fontSize: '10px' }}>{t('whatsapp', locale)}</a>
                    <a href={`tel:${lead.phone}`} style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', color: '#C9A84C', textDecoration: 'none', fontSize: '10px' }}>{t('call', locale)}</a>
                    {user?.role !== 'sales' && (
                      <button onClick={() => setShowTransfer(lead.id)} style={{ padding: '5px 8px', borderRadius: '6px', backgroundColor: 'rgba(155,89,182,0.1)', border: '1px solid rgba(155,89,182,0.2)', color: '#9B59B6', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '10px' }}>{t('transfer', locale)}</button>
                    )}
                  </div>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>{t('no_leads', locale)}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white', cursor: currentPage === 1 ? 'default' : 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px' }}>{t('prev', locale)}</button>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{t('page_of', locale)} {currentPage} {t('of', locale)} {totalPages} ({filtered.length} {t('lead', locale)})</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'white', cursor: currentPage === totalPages ? 'default' : 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px' }}>{t('next', locale)}</button>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>إضافة ليد جديد</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>الاسم *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>التليفون *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ ...inputStyle, direction: 'ltr' }} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>الإيميل</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, direction: 'ltr' }} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>المشروع المهتم بيه</label>
                <select value={form.project_id} onChange={e => { const p = projects.find(pr => pr.id === e.target.value); setForm({ ...form, project_id: e.target.value, project_interest: p?.name_ar || form.project_interest }); }} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر مشروع</option>
                  {projects.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#0A0F1A' }}>{p.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>نوع الوحدة</label>
                <select value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>{t('unassigned', locale)}</option>
                  {Object.entries(unitTypeLabel).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>قيمة الصفقة المتوقعة (جنيه)</label>
                <input type="number" value={form.deal_value} onChange={e => setForm({ ...form, deal_value: +e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>الميزانية</label>
                <input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>المصدر</label>
                <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
                </select>
              </div>
              {user?.role !== 'sales' && (
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>تعيين لـ</label>
                  <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ backgroundColor: '#0A0F1A' }}>{t('unassigned', locale)}</option>
                    {users.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#0A0F1A' }}>{u.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
              <button onClick={handleAdd} disabled={saving || !form.name || !form.phone} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal (single + bulk selected) */}
      {showTransfer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>
              {showTransfer === 'bulk' ? `تحويل ${selectedLeads.size} ليد محدد` : 'تحويل الليد'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>تحويل إلى</label>
                <select value={transferTo} onChange={e => setTransferTo(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر مستخدم</option>
                  {users.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#0A0F1A' }}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              {showTransfer !== 'bulk' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.15)' }}>
                  <input type="checkbox" checked={hideComments} onChange={e => setHideComments(e.target.checked)} id="hideComments" />
                  <label htmlFor="hideComments" style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '13px' }}>
                    إخفاء التعليقات السابقة عن السيلز الجديد
                  </label>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { setShowTransfer(null); setTransferTo(''); setHideComments(false); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
              <button onClick={() => showTransfer === 'bulk' ? handleBulkTransferSelected() : handleTransfer(showTransfer!)} disabled={!transferTo} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#C9A84C', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {showTransfer === 'bulk' ? `تحويل ${selectedLeads.size} ليد` : 'تحويل الليد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign by Count Modal */}
      {showBulkTransfer && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{locale === 'ar' ? 'توزيع الليدز' : 'Distribute Leads'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>
              {locale === 'ar' ? `${leads.filter(l => !l.assigned_to).length} ليد غير مخصص · ${getTeamMembers().length} عضو في الفريق` : `${leads.filter(l => !l.assigned_to).length} unassigned leads · ${getTeamMembers().length} team members`}
            </p>

            {/* Team Members */}
            <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginBottom: '10px' }}>{locale === 'ar' ? 'فريقك' : 'Your Team'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {getTeamMembers().map(u => (
                  <span key={u.id} style={{ padding: '4px 12px', borderRadius: '50px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.2)', color: '#4A90D9', fontSize: '12px' }}>{u.name}</span>
                ))}
                {getTeamMembers().length === 0 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{locale === 'ar' ? 'لا يوجد أعضاء' : 'No members'}</span>}
              </div>
            </div>

            {/* Auto Distribute */}
            <button onClick={handleAutoDistribute} disabled={getTeamMembers().length === 0} style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '14px', marginBottom: '16px' }}>
              ⚡ {locale === 'ar' ? `توزيع تلقائي بالتساوي على ${getTeamMembers().length} سيلز` : `Auto-distribute equally among ${getTeamMembers().length} reps`}
            </button>

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginBottom: '16px' }}>{locale === 'ar' ? 'أو اختار يدوي' : 'or assign manually'}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'عدد الليدز' : 'Number of leads'}</label>
                <input type="number" value={bulkCount} onChange={e => setBulkCount(e.target.value)} placeholder={locale === 'ar' ? 'مثلاً 20' : 'e.g. 20'} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'من مصدر' : 'From source'}</label>
                <select value={bulkSourceFilter} onChange={e => setBulkSourceFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{t('all_sources', locale)}</option>
                  {Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'تحويل لـ' : 'Assign to'}</label>
                <select value={bulkTransferTo} onChange={e => setBulkTransferTo(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'اختر عضو' : 'Select member'}</option>
                  {user?.role === 'superadmin'
                    ? users.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#0A0F1A' }}>{u.name} ({u.role === 'admin' ? (locale === 'ar' ? 'أدمن' : 'Admin') : (locale === 'ar' ? 'سيلز' : 'Sales')})</option>)
                    : getTeamMembers().map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#0A0F1A' }}>{u.name}</option>)
                  }
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => { setShowBulkTransfer(false); setBulkCount(''); setBulkTransferTo(''); setBulkSourceFilter('all'); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleBulkAssignByCount} disabled={!bulkCount || !bulkTransferTo} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#C9A84C', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {locale === 'ar' ? 'توزيع يدوي' : 'Manual Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}