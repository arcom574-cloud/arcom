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
        let allQuery = supabaseAdmin.from('leads').select('*, crm_users(name)');
        if (hasBranchFilter) allQuery = allQuery.eq('branch_id', currentBranch);
        const { data } = await allQuery;
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

      // Sales performance (superadmin and admin only)
      if (u.role !== 'sales') {
        let usersQuery = supabaseAdmin.from('crm_users').select('id, name, role, managed_by, branch_id').eq('active', true).in('role', ['sales', 'admin']);
        if (u.role === 'admin') usersQuery = usersQuery.eq('managed_by', u.id);
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
        let allUsersQuery = supabaseAdmin.from('crm_users').select('id, name, role, managed_by, branch_id').eq('active', true);
        if (hasBranchFilter) allUsersQuery = allUsersQuery.eq('branch_id', currentBranch);
        const { data: allUsersData } = await allUsersQuery;
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
  const wonLeads = leads.filter(l => l.status === 'closed_won');
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

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
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: '0 0 8px' }}>🏆 {locale === 'ar' ? 'سيلز الفرع' : 'Branch Sales'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                      {branchSales.slice(0, 6).map((s, i) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: '12px', color: i === 0 ? '#FFC800' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>{s.total} {locale === 'ar' ? 'ليد' : 'leads'} · {s.won} {locale === 'ar' ? 'مبيعة' : 'won'}</p>
                          </div>
                        </div>
                      ))}
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