'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { useBranch } from '@/lib/crm/useBranch';
import { t, getStatusLabel } from '@/lib/crm/translations';

type Lead = {
  id: string; name: string; phone: string; status: string;
  deal_value: number; assigned_to: string; created_at: string;
  last_contact_at: string; crm_users?: { name: string };
};

type Target = { id: string; user_id: string; month: string; target_amount: number; target_units: number; target_leads: number; };

type SalesPerf = {
  id: string; name: string; role: string; total: number; won: number;
  pipelineValue: number; wonValue: number; conversionRate: number;
};

type AdminPerf = {
  id: string; name: string; teamSize: number; total: number; won: number;
  wonValue: number; pipelineValue: number; conversionRate: number;
};

const stages = [
  { key: 'new', label: 'جديد', color: '#4A90D9' },
  { key: 'contacted', label: 'تم التواصل', color: '#C9A84C' },
  { key: 'meeting_scheduled', label: 'موعد محدد', color: '#9B59B6' },
  { key: 'site_visit', label: 'زيارة ميدانية', color: '#E67E22' },
  { key: 'negotiation', label: 'تفاوض', color: '#F39C12' },
  { key: 'contract', label: 'عقد', color: '#16A085' },
  { key: 'closed_won', label: 'تم البيع', color: '#00ff88' },
  { key: 'closed_lost', label: 'فاقد', color: '#ff4444' },
];

const stageWeight: Record<string, number> = {
  new: 0.05, contacted: 0.15, meeting_scheduled: 0.3, site_visit: 0.45,
  negotiation: 0.65, contract: 0.85, closed_won: 1, closed_lost: 0,
  postponed: 0.1, interested: 0.25,
};

export default function CRMDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [salesPerf, setSalesPerf] = useState<SalesPerf[]>([]);
  const [adminPerf, setAdminPerf] = useState<AdminPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [coldLeads, setColdLeads] = useState<Lead[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { locale, dir } = useCrmLocale();
  const { branchFilter, refreshKey } = useBranch();

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem('crm_user');
      const u = stored ? JSON.parse(stored) : null;
      if (!u) return;

      const currentBranch = localStorage.getItem('crm_selected_branch');
      const hasBranchFilter = u.role === 'superadmin' && currentBranch && currentBranch !== 'all';

      let allData: any[] | null = null;
      if (u.role !== 'sales') {
        const { data } = await supabaseAdmin.from('leads').select('*, crm_users(name)');
        allData = data;
        if (data) setAllLeads(data);
      }

      let query = supabaseAdmin.from('leads').select('*, crm_users(name)');

      if (u.role === 'sales') {
        query = query.eq('assigned_to', u.id);
      } else if (u.role === 'admin') {
        const { data: teamMembers } = await supabaseAdmin.from('crm_users').select('id').eq('managed_by', u.id);
        const teamIds = [u.id, ...(teamMembers || []).map((t: any) => t.id)];
        query = query.in('assigned_to', teamIds);
      } else if (u.role === 'head_sales') {
        if (u.branch_id) query = query.eq('branch_id', u.branch_id);
      } else if (hasBranchFilter) {
        query = query.eq('branch_id', currentBranch);
      }

      const { data } = await query;
      if (data) {
        setLeads(data);

        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const cold = data.filter((l: Lead) =>
          !['closed_won', 'closed_lost'].includes(l.status) &&
          (!l.last_contact_at || new Date(l.last_contact_at) < threeDaysAgo)
        );
        setColdLeads(cold);

        // Auto-create reminders for cold leads (no reminder exists yet)
        if (u.role !== 'sales' || true) {
          for (const coldLead of cold.slice(0, 5)) {
            const { data: existingReminder } = await supabaseAdmin
              .from('lead_reminders')
              .select('id')
              .eq('lead_id', coldLead.id)
              .eq('done', false)
              .limit(1);

            if (!existingReminder || existingReminder.length === 0) {
              const reminderDate = new Date();
              reminderDate.setHours(reminderDate.getHours() + 2);
              await supabaseAdmin.from('lead_reminders').insert({
                lead_id: coldLead.id,
                user_id: coldLead.assigned_to || u.id,
                reminder_date: reminderDate.toISOString(),
                note: locale === 'ar' ? 'تذكير تلقائي: العميل محتاج متابعة' : 'Auto reminder: Client needs follow-up',
              });
            }
          }
        }
      }

      // Sales performance (superadmin, admin, head_sales)
      if (u.role !== 'sales') {
        let usersQuery = supabaseAdmin.from('crm_users').select('id, name, role, managed_by, branch_id').eq('active', true).in('role', ['sales', 'admin']);
        if (u.role === 'admin') usersQuery = usersQuery.eq('managed_by', u.id);
        if (u.role === 'head_sales' && u.branch_id) usersQuery = usersQuery.eq('branch_id', u.branch_id);
        if (hasBranchFilter) usersQuery = usersQuery.eq('branch_id', currentBranch);

        const { data: salesUsers } = await usersQuery;

        if (salesUsers && data) {
          const perf = salesUsers.map((s: any) => {
            const userLeads = data.filter((l: Lead) => l.assigned_to === s.id);
            const won = userLeads.filter((l: Lead) => l.status === 'closed_won');
            const wonValue = won.reduce((sum: number, l: Lead) => sum + (l.deal_value || 0), 0);
            const pipelineValue = userLeads
              .filter((l: Lead) => !['closed_won', 'closed_lost'].includes(l.status))
              .reduce((sum: number, l: Lead) => sum + (l.deal_value || 0) * (stageWeight[l.status] || 0), 0);

            return {
              id: s.id, name: s.name, role: s.role,
              total: userLeads.length, won: won.length, wonValue, pipelineValue,
              conversionRate: userLeads.length > 0 ? Math.round((won.length / userLeads.length) * 100) : 0,
            };
          });
          setSalesPerf(perf.sort((a, b) => b.pipelineValue - a.pipelineValue));
        }
      }

      // Admin performance overview (superadmin only)
      if (u.role === 'superadmin' && allData) {
        const { data: allUsersData } = await supabaseAdmin.from('crm_users').select('id, name, role, managed_by, branch_id').eq('active', true);
        if (allUsersData) setAllUsers(allUsersData);
        const { data: branchesData } = await supabaseAdmin.from('branches').select('*').order('created_at');
        if (branchesData) setBranches(branchesData);
        const admins = (allUsersData || []).filter((usr: any) => usr.role === 'admin');
        const sales = (allUsersData || []).filter((usr: any) => usr.role === 'sales');

        const adminStats = admins.map((admin: any) => {
          const teamSales = sales.filter((s: any) => s.managed_by === admin.id);
          const teamIds = [admin.id, ...teamSales.map((s: any) => s.id)];
          const teamLeads = allData.filter((l: Lead) => teamIds.includes(l.assigned_to));
          const won = teamLeads.filter((l: Lead) => l.status === 'closed_won');
          const wonValue = won.reduce((sum: number, l: Lead) => sum + (l.deal_value || 0), 0);
          const pipelineValue = teamLeads
            .filter((l: Lead) => !['closed_won', 'closed_lost'].includes(l.status))
            .reduce((sum: number, l: Lead) => sum + (l.deal_value || 0) * (stageWeight[l.status] || 0), 0);

          return {
            id: admin.id, name: admin.name, teamSize: teamSales.length,
            total: teamLeads.length, won: won.length, wonValue, pipelineValue,
            conversionRate: teamLeads.length > 0 ? Math.round((won.length / teamLeads.length) * 100) : 0,
          };
        });
        setAdminPerf(adminStats.sort((a, b) => b.wonValue - a.wonValue));
      }

      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const { data: targetsData } = await supabaseAdmin.from('sales_targets').select('*').eq('month', currentMonth);
      if (targetsData) setTargets(targetsData);

      setLoading(false);
    };
    load();
  }, [refreshKey]);

  const totalDealValue = leads.filter(l => l.status === 'closed_won').reduce((s, l) => s + (l.deal_value || 0), 0);
  const totalPipeline = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).reduce((s, l) => s + (l.deal_value || 0) * (stageWeight[l.status] || 0), 0);

  const stageCounts = stages.map(s => ({ ...s, count: leads.filter(l => l.status === s.key).length }));
  const maxAdminValue = Math.max(...adminPerf.map(a => a.wonValue), 1);

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  const isSuperAdmin = user?.role === 'superadmin';
  const isSales = user?.role === 'sales';
  const isHeadSales = user?.role === 'head_sales';
  const wonLeads = leads.filter(l => l.status === 'closed_won');
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  const statusLabelMap: Record<string, string> = locale === 'ar'
    ? { new: 'جديد', contacted: 'تم التواصل', meeting_scheduled: 'موعد', site_visit: 'زيارة', negotiation: 'تفاوض', contract: 'عقد', closed_won: 'تم البيع', closed_lost: 'فاقد', postponed: 'مؤجل', interested: 'مهتم' }
    : { new: 'New', contacted: 'Contacted', meeting_scheduled: 'Meeting', site_visit: 'Visit', negotiation: 'Negotiation', contract: 'Contract', closed_won: 'Won', closed_lost: 'Lost', postponed: 'Postponed', interested: 'Interested' };

  // ========== HEAD OF SALES DASHBOARD ==========
  if (isHeadSales) {
    const salesUsers = salesPerf;
    const totalLeadsCount = leads.length;
    const totalWon = salesUsers.reduce((s, u) => s + u.won, 0);
    const totalConv = totalLeadsCount > 0 ? Math.round((totalWon / totalLeadsCount) * 100) : 0;

    return (
      <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ color: '#E67E22', fontSize: '11px', letterSpacing: '4px', marginBottom: '8px' }}>SALES MONITOR</p>
          <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-1px' }}>{locale === 'ar' ? 'متابعة أداء السيلز' : 'Sales Performance'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: '14px' }}>{user?.name} · {locale === 'ar' ? 'هيد أوف سيلز' : 'Head of Sales'}</p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '32px' }}>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(74,144,217,0.12) 0%, rgba(74,144,217,0.04) 100%)', border: '1px solid rgba(74,144,217,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px', letterSpacing: '1px' }}>{locale === 'ar' ? 'السيلز' : 'REPS'}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#4A90D9', margin: 0 }}>{salesUsers.length}</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px', letterSpacing: '1px' }}>{locale === 'ar' ? 'إجمالي الليدز' : 'TOTAL LEADS'}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#C9A84C', margin: 0 }}>{totalLeadsCount}</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(0,255,136,0.12) 0%, rgba(0,255,136,0.04) 100%)', border: '1px solid rgba(0,255,136,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px', letterSpacing: '1px' }}>{locale === 'ar' ? 'صفقات مغلقة' : 'DEALS WON'}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#00ff88', margin: 0 }}>{totalWon}</p>
          </div>
          <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(155,89,182,0.12) 0%, rgba(155,89,182,0.04) 100%)', border: '1px solid rgba(155,89,182,0.15)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px', letterSpacing: '1px' }}>{locale === 'ar' ? 'نسبة التحويل' : 'CONVERSION'}</p>
            <p style={{ fontSize: '28px', fontWeight: 900, color: '#9B59B6', margin: 0 }}>{totalConv}%</p>
          </div>
        </div>

        {/* Sales Reps */}
        {salesUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '40px', marginBottom: '12px' }}>👥</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>{locale === 'ar' ? 'لا يوجد سيلز في فرعك' : 'No sales reps in your branch'}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {salesUsers.map((s, i) => {
            const salesLeads = leads.filter(l => l.assigned_to === s.id);
            const target = targets.find(tg => tg.user_id === s.id);
            const targetPct = target?.target_amount && target.target_amount > 0 ? Math.min(Math.round((s.wonValue / target.target_amount) * 100), 100) : null;
            const statusGroups: Record<string, typeof salesLeads> = {};
            salesLeads.forEach(l => { if (!statusGroups[l.status]) statusGroups[l.status] = []; statusGroups[l.status].push(l); });

            return (
              <div key={s.id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden' }}>

                {/* Rep Header */}
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: i === 0 ? 'linear-gradient(135deg, rgba(255,200,0,0.06) 0%, transparent 100%)' : 'transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: i === 0 ? 'linear-gradient(135deg, #FFC800 0%, #E67E22 100%)' : i === 1 ? 'linear-gradient(135deg, #C0C0C0 0%, #888 100%)' : i === 2 ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)' : 'rgba(74,144,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'white', fontWeight: 900 }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: '0 0 2px' }}>{s.name}</h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>{salesLeads.length} {locale === 'ar' ? 'ليد' : 'leads'}</span>
                        <span style={{ color: '#00ff88' }}>{s.won} {locale === 'ar' ? 'مبيعة' : 'won'}</span>
                        <span style={{ color: '#C9A84C' }}>{s.conversionRate}%</span>
                        {s.wonValue > 0 && <span style={{ color: '#00ff88' }}>{s.wonValue.toLocaleString()} {locale === 'ar' ? 'ج' : 'EGP'}</span>}
                      </div>
                    </div>
                  </div>
                  {targetPct !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '80px', height: '8px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '50px', backgroundColor: targetPct >= 100 ? '#00ff88' : targetPct >= 50 ? '#F39C12' : '#ff4444', width: `${targetPct}%`, transition: 'width 0.8s ease' }} />
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: targetPct >= 100 ? '#00ff88' : targetPct >= 50 ? '#F39C12' : '#ff4444' }}>{targetPct}%</span>
                    </div>
                  )}
                </div>

                {/* Pipeline stages with leads */}
                {salesLeads.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '13px' }}>{locale === 'ar' ? 'لا يوجد ليدز حالياً' : 'No leads currently'}</p>
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px' }}>
                    {stages.filter(st => statusGroups[st.key]?.length).map(stage => (
                      <div key={stage.key} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: stage.color }} />
                          <span style={{ fontSize: '12px', fontWeight: 700, color: stage.color }}>{statusLabelMap[stage.key]}</span>
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>({statusGroups[stage.key].length})</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingRight: '18px' }}>
                          {statusGroups[stage.key].map(lead => {
                            const daysSince = lead.last_contact_at ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / (1000 * 60 * 60 * 24)) : null;
                            return (
                              <div key={lead.id} style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: `${stage.color}08`, border: `1px solid ${stage.color}20`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'white', fontWeight: 500 }}>{lead.name}</span>
                                {daysSince !== null && (
                                  <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '50px', backgroundColor: daysSince > 3 ? 'rgba(255,68,68,0.15)' : daysSince > 1 ? 'rgba(243,156,18,0.15)' : 'rgba(37,211,102,0.15)', color: daysSince > 3 ? '#ff4444' : daysSince > 1 ? '#F39C12' : '#25D366' }}>
                                    {daysSince === 0 ? (locale === 'ar' ? 'اليوم' : 'today') : daysSince === 1 ? (locale === 'ar' ? 'أمس' : '1d') : `${daysSince}${locale === 'ar' ? ' يوم' : 'd'}`}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{t('welcome', locale)} {user?.name} 👋</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {isSuperAdmin ? t('overview_all', locale) : user?.role === 'admin' ? t('overview_team', locale) : t('overview_personal', locale)}
        </p>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isSales ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', margin: '0 0 8px' }}>{isSales ? t('my_sales', locale) : t('total_sales', locale)}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#00ff88', margin: 0 }}>{totalDealValue.toLocaleString()} {t('egp', locale)}</p>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', margin: '0 0 8px' }}>{isSales ? t('my_pipeline', locale) : t('pipeline_value', locale)}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#4A90D9', margin: 0 }}>{Math.round(totalPipeline).toLocaleString()} {t('egp', locale)}</p>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', margin: '0 0 8px' }}>{isSales ? t('my_leads', locale) : t('total_leads', locale)}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#C9A84C', margin: 0 }}>{leads.length}</p>
        </div>
        {isSales && (
          <>
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(155,89,182,0.08)', border: '1px solid rgba(155,89,182,0.25)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', margin: '0 0 8px' }}>{t('conversion_rate', locale)}</p>
              <p style={{ fontSize: '26px', fontWeight: 900, color: '#9B59B6', margin: 0 }}>{conversionRate}%</p>
            </div>
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', margin: '0 0 8px' }}>{t('closed_deals', locale)}</p>
              <p style={{ fontSize: '26px', fontWeight: 900, color: '#00ff88', margin: 0 }}>{wonLeads.length}</p>
            </div>
          </>
        )}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: coldLeads.length > 0 ? 'rgba(255,68,68,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${coldLeads.length > 0 ? 'rgba(255,68,68,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', letterSpacing: '1px', margin: '0 0 8px' }}>⚠️ {t('needs_followup', locale)}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: coldLeads.length > 0 ? '#ff4444' : 'white', margin: 0 }}>{coldLeads.length}</p>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>{isSales ? t('my_stage_distribution', locale) : t('stage_distribution', locale)}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px' }}>
          {stageCounts.map(s => (
            <div key={s.key} style={{ padding: '14px 10px', borderRadius: '12px', backgroundColor: `${s.color}12`, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Head of Sales - Sales Monitoring Dashboard */}
      {isHeadSales && salesPerf.length > 0 && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(230,126,34,0.2)', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(230,126,34,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#E67E22' }}>📊 {locale === 'ar' ? 'متابعة أداء السيلز' : 'Sales Team Monitoring'}</h2>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{salesPerf.length} {locale === 'ar' ? 'سيلز في فرعك' : 'sales reps in your branch'}</p>
          </div>
          <div style={{ padding: '12px' }}>
            {salesPerf.map((s, i) => {
              const target = targets.find(tg => tg.user_id === s.id);
              const targetPct = target?.target_amount && target.target_amount > 0 ? Math.min(Math.round((s.wonValue / target.target_amount) * 100), 100) : null;
              const salesLeads = leads.filter(l => l.assigned_to === s.id);
              const statusCounts: Record<string, number> = {};
              salesLeads.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });

              return (
                <div key={s.id} style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: i === 0 ? '#FFC800' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.3)' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>{s.name}</p>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.total} {locale === 'ar' ? 'ليد' : 'leads'} · {s.won} {locale === 'ar' ? 'مبيعة' : 'won'} · {s.conversionRate}%</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#00ff88', margin: 0 }}>{s.wonValue.toLocaleString()}</p>
                      <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t('egp', locale)}</p>
                    </div>
                  </div>

                  {/* Lead stages breakdown */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: targetPct !== null ? '8px' : '0' }}>
                    {stages.filter(st => statusCounts[st.key]).map(st => (
                      <div key={st.key} style={{ flex: statusCounts[st.key], height: '6px', borderRadius: '3px', backgroundColor: st.color, minWidth: '4px' }} title={`${st.label}: ${statusCounts[st.key]}`} />
                    ))}
                    {salesLeads.length === 0 && <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)' }} />}
                  </div>
                  {salesLeads.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: targetPct !== null ? '8px' : '0' }}>
                      {stages.filter(st => statusCounts[st.key]).map(st => (
                        <span key={st.key} style={{ fontSize: '9px', color: st.color }}>{statusCounts[st.key]} {st.label}</span>
                      ))}
                    </div>
                  )}

                  {/* Target */}
                  {targetPct !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', minWidth: '35px' }}>🎯</span>
                      <div style={{ flex: 1, height: '5px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '50px', backgroundColor: targetPct >= 100 ? '#00ff88' : targetPct >= 50 ? '#F39C12' : '#ff4444', width: `${targetPct}%` }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: targetPct >= 100 ? '#00ff88' : targetPct >= 50 ? '#F39C12' : '#ff4444', minWidth: '30px' }}>{targetPct}%</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Tracking */}
      {!isSales && targets.length > 0 && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>🎯 {t('monthly_targets', locale)}</h2>
            <Link href="/crm/targets" style={{ color: '#4A90D9', fontSize: '12px', textDecoration: 'none' }}>{t('manage_targets', locale)} ←</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {targets.slice(0, 6).map(t => {
              const perf = salesPerf.find(s => s.id === t.user_id);
              if (!perf) return null;
              const pct = t.target_amount > 0 ? Math.min(Math.round((perf.wonValue / t.target_amount) * 100), 100) : 0;
              return (
                <div key={t.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>{perf.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{perf.wonValue.toLocaleString()} / {t.target_amount.toLocaleString()} ج</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: pct >= 100 ? '#00ff88' : pct >= 50 ? '#F39C12' : '#ff4444' }}>{pct}%</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '50px', backgroundColor: pct >= 100 ? '#00ff88' : pct >= 50 ? '#F39C12' : '#ff4444', width: `${pct}%`, transition: 'width 0.5s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Performance by Branch (superadmin only) */}
      {isSuperAdmin && adminPerf.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {(branches.length > 0 ? branches : [{ id: 'none', name: locale === 'ar' ? 'كل الفروع' : 'All Branches' }]).map(branch => {
            const branchAdmins = branches.length > 0
              ? adminPerf.filter(a => allUsers.find(u => u.id === a.id)?.branch_id === branch.id)
              : adminPerf;
            if (branchAdmins.length === 0) return null;
            const branchSales = branches.length > 0
              ? salesPerf.filter(s => allUsers.find(u => u.id === s.id)?.branch_id === branch.id)
              : salesPerf;
            const branchMaxValue = Math.max(...branchAdmins.map(a => a.wonValue), 1);

            return (
              <div key={branch.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(155,89,182,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🏢</span>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'white' }}>{branch.name}</h2>
                      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                        {branchAdmins.length} {locale === 'ar' ? 'أدمن' : 'admins'} · {branchSales.length} {locale === 'ar' ? 'سيلز' : 'sales'}
                      </p>
                    </div>
                  </div>
                  <Link href="/crm/reports" style={{ color: '#4A90D9', fontSize: '12px', textDecoration: 'none' }}>{t('full_details', locale)} ←</Link>
                </div>

                {/* Admins in this branch */}
                <div style={{ padding: '8px 16px' }}>
                  {branchAdmins.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 8px', borderBottom: i < branchAdmins.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(155,89,182,0.15)', border: '2px solid rgba(155,89,182,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>🛡️</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{a.name}</p>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          <span>{a.teamSize} {locale === 'ar' ? 'سيلز' : 'sales'}</span>
                          <span>{a.total} {locale === 'ar' ? 'ليد' : 'leads'}</span>
                          <span style={{ color: '#00ff88' }}>{a.won} {locale === 'ar' ? 'مبيعة' : 'won'}</span>
                          <span>{a.conversionRate}%</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'left', minWidth: '90px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#00ff88', margin: 0 }}>{a.wonValue.toLocaleString()}</p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{t('egp', locale)}</p>
                      </div>
                      <div style={{ width: '80px' }}>
                        <div style={{ height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '50px', backgroundColor: '#9B59B6', width: `${(a.wonValue / branchMaxValue) * 100}%`, transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sales in this branch */}
                {branchSales.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '0 0 10px', letterSpacing: '1px' }}>🏆 {locale === 'ar' ? 'أداء السيلز' : 'Sales Performance'}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {branchSales.map((s, i) => {
                        const target = targets.find(tg => tg.user_id === s.id);
                        const targetPct = target?.target_amount && target.target_amount > 0 ? Math.min(Math.round((s.wonValue / target.target_amount) * 100), 100) : null;
                        const adminName = allUsers.find(u => u.id === (allUsers.find(x => x.id === s.id)?.managed_by))?.name;
                        return (
                          <div key={s.id} style={{ padding: '10px 12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: i === 0 ? '#FFC800' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.3)', width: '20px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{s.name}</span>
                                  {adminName && <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>← {adminName}</span>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '12px', fontSize: '11px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{s.total} {locale === 'ar' ? 'ليد' : 'leads'}</span>
                                <span style={{ color: '#00ff88', fontWeight: 700 }}>{s.won} {locale === 'ar' ? 'مبيعة' : 'won'}</span>
                                <span style={{ color: '#C9A84C' }}>{s.conversionRate}%</span>
                              </div>
                            </div>
                            {/* Target progress */}
                            {targetPct !== null && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', minWidth: '40px' }}>{locale === 'ar' ? 'التارجت' : 'Target'}</span>
                                <div style={{ flex: 1, height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: '50px', backgroundColor: targetPct >= 100 ? '#00ff88' : targetPct >= 50 ? '#F39C12' : '#ff4444', width: `${targetPct}%`, transition: 'width 0.5s' }} />
                                </div>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: targetPct >= 100 ? '#00ff88' : targetPct >= 50 ? '#F39C12' : '#ff4444', minWidth: '35px', textAlign: 'center' }}>{targetPct}%</span>
                              </div>
                            )}
                            {targetPct === null && (
                              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', margin: '2px 0 0 28px' }}>{locale === 'ar' ? 'بدون تارجت' : 'No target set'}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: !isSales && salesPerf.length > 0 ? '1.3fr 1fr' : '1fr', gap: '24px' }}>

        {/* Sales Leaderboard (admin/superadmin only) */}
        {!isSales && salesPerf.length > 0 && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>🏆 {t('sales_leaderboard', locale)}</h2>
            </div>
            <div style={{ padding: '8px 16px' }}>
              {salesPerf.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 8px', borderBottom: i < salesPerf.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: i === 0 ? 'rgba(255,200,0,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: i === 0 ? '#FFC800' : 'rgba(255,255,255,0.4)' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{s.name}</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      <span>{s.total} ليد</span>
                      <span style={{ color: '#00ff88' }}>{s.won} مبيعة</span>
                      <span>{s.conversionRate}% تحويل</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#4A90D9', margin: 0 }}>{Math.round(s.pipelineValue).toLocaleString()}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>جنيه pipeline</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cold Leads Alert */}
        <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>🔥 {t('urgent_followup', locale)}</h2>
          </div>
          <div style={{ padding: '8px 16px', maxHeight: '320px', overflowY: 'auto' }}>
            {coldLeads.slice(0, 8).map(lead => (
              <Link key={lead.id} href={`/crm/leads/${lead.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', margin: '0 0 2px' }}>{lead.name}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>{(lead.crm_users as any)?.name || t('unassigned', locale)}</p>
                  </div>
                  <span style={{ backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '50px', padding: '3px 10px', fontSize: '10px', color: '#ff4444' }}>
                    {t('late', locale)}
                  </span>
                </div>
              </Link>
            ))}
            {coldLeads.length === 0 && (
              <p style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>{t('all_followed', locale)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}