'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { useBranch } from '@/lib/crm/useBranch';
import { t } from '@/lib/crm/translations';

type Lead = {
  id: string; status: string; source: string; assigned_to: string;
  deal_value: number; created_at: string; crm_users?: { name: string };
};

type UserRow = { id: string; name: string; role: string; managed_by?: string; };
type Target = { id: string; user_id: string; month: string; target_amount: number; target_units: number; target_leads: number; };

const stageWeight: Record<string, number> = {
  new: 0.05, contacted: 0.15, meeting_scheduled: 0.3, site_visit: 0.45,
  negotiation: 0.65, contract: 0.85, closed_won: 1, closed_lost: 0,
  postponed: 0.1, interested: 0.25,
};

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const { locale, dir } = useCrmLocale();
  const { branchFilter, refreshKey } = useBranch();

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const load = async () => {
      let leadsQuery = supabaseAdmin.from('leads').select('*, crm_users(name)').order('created_at', { ascending: false });
      if (currentUser?.role === 'superadmin') {
        const currentBranch = localStorage.getItem('crm_selected_branch');
        if (currentBranch && currentBranch !== 'all') {
          leadsQuery = leadsQuery.eq('branch_id', currentBranch);
        }
      }
      const { data } = await leadsQuery;
      if (data) setLeads(data);
      const { data: usersData } = await supabaseAdmin.from('crm_users').select('id, name, role, managed_by').eq('active', true);
      if (usersData) setUsers(usersData);

      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const { data: targetsData } = await supabaseAdmin.from('sales_targets').select('*').eq('month', currentMonth);
      if (targetsData) setTargets(targetsData);

      const { data: projectsData } = await supabaseAdmin.from('projects').select('id, name_ar').eq('active', true);
      if (projectsData) setProjects(projectsData);

      const { data: unitsData } = await supabaseAdmin.from('project_units').select('id, project_id, status, price');
      if (unitsData) setUnits(unitsData);

      setLoading(false);
    };
    load();
  }, [refreshKey]);

  const filterByPeriod = (data: Lead[]) => {
    if (period === 'all') return data;
    const now = new Date();
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return data.filter(l => new Date(l.created_at) >= from);
  };

  const filtered = filterByPeriod(leads);

  const statusStats = [
    { key: 'new', label: 'جديد', color: '#4A90D9', icon: '🆕' },
    { key: 'contacted', label: 'تواصل', color: '#C9A84C', icon: '📞' },
    { key: 'meeting_scheduled', label: 'موعد', color: '#9B59B6', icon: '📅' },
    { key: 'site_visit', label: 'زيارة', color: '#E67E22', icon: '🚗' },
    { key: 'negotiation', label: 'تفاوض', color: '#F39C12', icon: '🤝' },
    { key: 'contract', label: 'عقد', color: '#16A085', icon: '📝' },
    { key: 'closed_won', label: 'بيع', color: '#00ff88', icon: '🏆' },
    { key: 'closed_lost', label: 'فاقد', color: '#ff4444', icon: '❌' },
  ].map(s => ({ ...s, count: filtered.filter(l => l.status === s.key).length }));

  const sourceStats = [
    { key: 'manual', label: 'يدوي' },
    { key: 'website', label: 'موقع' },
    { key: 'facebook', label: 'فيسبوك' },
    { key: 'whatsapp', label: 'واتساب' },
    { key: 'google', label: 'جوجل' },
  ].map(s => ({ ...s, count: filtered.filter(l => l.source === s.key).length }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  const calcUserStats = (userId: string) => {
    const userLeads = filtered.filter(l => l.assigned_to === userId);
    const won = userLeads.filter(l => l.status === 'closed_won');
    const wonValue = won.reduce((s, l) => s + (l.deal_value || 0), 0);
    const pipelineValue = userLeads
      .filter(l => !['closed_won', 'closed_lost'].includes(l.status))
      .reduce((s, l) => s + (l.deal_value || 0) * (stageWeight[l.status] || 0), 0);
    return {
      total: userLeads.length,
      won: won.length,
      wonValue,
      pipelineValue,
      conversion: userLeads.length > 0 ? Math.round((won.length / userLeads.length) * 100) : 0,
      coldCount: userLeads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length,
    };
  };

  const admins = users.filter(u => u.role === 'admin');
  const allSales = users.filter(u => u.role === 'sales');

  const adminReports = admins.map(admin => {
    const teamSales = allSales.filter(s => s.managed_by === admin.id);
    const teamIds = [admin.id, ...teamSales.map(s => s.id)];
    const teamLeads = filtered.filter(l => teamIds.includes(l.assigned_to));
    const teamWon = teamLeads.filter(l => l.status === 'closed_won');
    const teamWonValue = teamWon.reduce((s, l) => s + (l.deal_value || 0), 0);
    const teamPipeline = teamLeads
      .filter(l => !['closed_won', 'closed_lost'].includes(l.status))
      .reduce((s, l) => s + (l.deal_value || 0) * (stageWeight[l.status] || 0), 0);

    return {
      admin,
      teamSales,
      teamLeads,
      total: teamLeads.length,
      won: teamWon.length,
      wonValue: teamWonValue,
      pipelineValue: teamPipeline,
      conversion: teamLeads.length > 0 ? Math.round((teamWon.length / teamLeads.length) * 100) : 0,
      adminOwnStats: calcUserStats(admin.id),
    };
  }).sort((a, b) => b.wonValue - a.wonValue);

  const unassignedSales = allSales.filter(s => !s.managed_by);

  const totalWonValue = filtered.filter(l => l.status === 'closed_won').reduce((s, l) => s + (l.deal_value || 0), 0);
  const totalPipelineValue = filtered.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).reduce((s, l) => s + (l.deal_value || 0) * (stageWeight[l.status] || 0), 0);

  const maxSource = Math.max(...sourceStats.map(s => s.count), 1);
  const maxAdminValue = Math.max(...adminReports.map(a => a.wonValue), 1);

  const inputStyle = {
    padding: '8px 18px', borderRadius: '50px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px',
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const handleExportReport = () => {
    const salesData = (isSuperAdmin ? [...admins, ...allSales] : allSales).map(u => {
      const stats = calcUserStats(u.id);
      const target = targets.find(t => t.user_id === u.id);
      return {
        'الاسم': u.name,
        'الدور': u.role === 'admin' ? 'أدمن' : 'سيلز',
        'إجمالي الليدز': stats.total,
        'مبيعات': stats.won,
        'قيمة المبيعات': stats.wonValue,
        'Pipeline': Math.round(stats.pipelineValue),
        'نسبة التحويل': `${stats.conversion}%`,
        'هدف المبيعات': target?.target_amount || '-',
        'هدف الوحدات': target?.target_units || '-',
        'هدف الليدز': target?.target_leads || '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(salesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الأداء');

    const statusData = statusStats.map(s => ({ 'الحالة': s.label, 'العدد': s.count }));
    const ws2 = XLSX.utils.json_to_sheet(statusData);
    XLSX.utils.book_append_sheet(wb, ws2, 'توزيع الحالات');

    const sourceData = sourceStats.map(s => ({ 'المصدر': s.label, 'العدد': s.count }));
    const ws3 = XLSX.utils.json_to_sheet(sourceData);
    XLSX.utils.book_append_sheet(wb, ws3, 'المصادر');

    XLSX.writeFile(wb, `report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{t('reports', locale)}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{filtered.length} {t('lead', locale)}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'all', label: locale === 'ar' ? 'الكل' : 'All' },
            { key: 'week', label: locale === 'ar' ? 'أسبوع' : 'Week' },
            { key: 'month', label: locale === 'ar' ? 'شهر' : 'Month' },
            { key: 'quarter', label: locale === 'ar' ? '3 أشهر' : 'Quarter' },
          ].map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{ ...inputStyle, backgroundColor: period === p.key ? '#1B4B8A' : 'rgba(255,255,255,0.05)', border: period === p.key ? '1px solid #4A90D9' : '1px solid rgba(255,255,255,0.1)', color: period === p.key ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {p.label}
            </button>
          ))}
          <button onClick={handleExportReport} style={{ ...inputStyle, backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}>
            {t('export_excel', locale)}
          </button>
        </div>
      </div>

      {/* Top Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 8px' }}>{locale === 'ar' ? 'إجمالي قيمة المبيعات' : 'Total Sales Value'}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#00ff88', margin: 0 }}>{totalWonValue.toLocaleString()} {t('egp', locale)}</p>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 8px' }}>{locale === 'ar' ? 'قيمة Pipeline المتوقعة' : 'Expected Pipeline'}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#4A90D9', margin: 0 }}>{Math.round(totalPipelineValue).toLocaleString()} {t('egp', locale)}</p>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 8px' }}>{locale === 'ar' ? 'نسبة التحويل الإجمالية' : 'Overall Conversion'}</p>
          <p style={{ fontSize: '26px', fontWeight: 900, color: '#C9A84C', margin: 0 }}>
            {filtered.length > 0 ? Math.round((filtered.filter(l => l.status === 'closed_won').length / filtered.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Status Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {statusStats.map(s => (
          <div key={s.key} style={{ padding: '16px 10px', borderRadius: '14px', backgroundColor: `${s.color}10`, border: `1px solid ${s.color}25`, textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.count}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Funnel Analysis */}
      <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: '#9B59B6' }}>
          {locale === 'ar' ? '📊 تحليل الـ Funnel' : '📊 Funnel Analysis'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {statusStats.filter(s => !['closed_lost'].includes(s.key)).map((stage, i, arr) => {
            const nextStage = arr[i + 1];
            const convRate = nextStage && stage.count > 0 ? Math.round((nextStage.count / stage.count) * 100) : null;
            const maxCount = Math.max(...statusStats.map(s => s.count), 1);
            const barWidth = Math.max((stage.count / maxCount) * 100, 5);
            return (
              <div key={stage.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ minWidth: '80px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: locale === 'ar' ? 'right' : 'left' }}>{stage.label}</span>
                  <div style={{ flex: 1, height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${barWidth}%`, backgroundColor: `${stage.color}40`, borderRadius: '6px', display: 'flex', alignItems: 'center', paddingRight: '8px', paddingLeft: '8px', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: stage.color }}>{stage.count}</span>
                    </div>
                  </div>
                  {convRate !== null && i < arr.length - 1 && (
                    <span style={{ minWidth: '50px', fontSize: '11px', color: convRate >= 50 ? '#00ff88' : convRate >= 20 ? '#F39C12' : '#ff4444', fontWeight: 700, textAlign: 'center' }}>
                      {convRate}% ↓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Source Stats */}
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>{locale === 'ar' ? '📊 الليدز بالمصدر' : '📊 Leads by Source'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {sourceStats.map(s => (
              <div key={s.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{s.label}</span>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{s.count}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '50px', backgroundColor: '#4A90D9', width: `${(s.count / maxSource) * 100}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
            {sourceStats.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{locale === 'ar' ? 'لا يوجد بيانات' : 'No data'}</p>}
          </div>
        </div>

        {/* Conversion */}
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#25D366' }}>{locale === 'ar' ? '🏆 ملخص الأداء' : '🏆 Performance Summary'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
            <div style={{ fontSize: '64px', fontWeight: 900, color: '#25D366', lineHeight: 1 }}>
              {filtered.length > 0 ? Math.round((filtered.filter(l => l.status === 'closed_won').length / filtered.length) * 100) : 0}%
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: 0 }}>{locale === 'ar' ? 'نسبة التحويل لمبيعات' : 'Sales Conversion Rate'}</p>
            <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00ff88' }}>{filtered.filter(l => l.status === 'closed_won').length}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{locale === 'ar' ? 'مبيعات' : 'Sales'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#4A90D9' }}>{filtered.length}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{locale === 'ar' ? 'إجمالي' : 'Total'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Tracking */}
      {isSuperAdmin && targets.length > 0 && (
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#E67E22' }}>{locale === 'ar' ? '🎯 تحقيق الأهداف الشهرية' : '🎯 Monthly Target Progress'} ({new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {(locale === 'ar' ? ['الاسم', 'هدف المبيعات', 'المحقق (مبيعات)', 'التقدم', 'هدف الوحدات', 'المحقق (وحدات)', 'هدف الليدز', 'المحقق (ليدز)'] : ['Name', 'Sales Target', 'Achieved (Sales)', 'Progress', 'Units Target', 'Achieved (Units)', 'Leads Target', 'Achieved (Leads)']).map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {targets.map(t => {
                const u = users.find(usr => usr.id === t.user_id);
                if (!u) return null;
                const stats = calcUserStats(u.id);
                const amountPct = t.target_amount > 0 ? Math.min(Math.round((stats.wonValue / t.target_amount) * 100), 100) : 0;
                const unitsPct = t.target_units > 0 ? Math.min(Math.round((stats.won / t.target_units) * 100), 100) : 0;
                const leadsPct = t.target_leads > 0 ? Math.min(Math.round((stats.total / t.target_leads) * 100), 100) : 0;
                return (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: 'white' }}>{u.name}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t.target_amount.toLocaleString()} ج</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: '#00ff88', fontWeight: 700 }}>{stats.wonValue.toLocaleString()} ج</td>
                    <td style={{ padding: '12px', width: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1, height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '50px', backgroundColor: amountPct >= 100 ? '#00ff88' : amountPct >= 50 ? '#F39C12' : '#ff4444', width: `${amountPct}%` }} />
                        </div>
                        <span style={{ fontSize: '11px', color: amountPct >= 100 ? '#00ff88' : '#C9A84C', fontWeight: 700, minWidth: '32px' }}>{amountPct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t.target_units}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: unitsPct >= 100 ? '#00ff88' : 'white', fontWeight: 700 }}>{stats.won} ({unitsPct}%)</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{t.target_leads}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: leadsPct >= 100 ? '#00ff88' : 'white', fontWeight: 700 }}>{stats.total} ({leadsPct}%)</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin Performance (superadmin only) */}
      {isSuperAdmin && adminReports.length > 0 && (
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#9B59B6' }}>{locale === 'ar' ? '🛡️ أداء المديرين وفِرَقهم' : '🛡️ Admin & Team Performance'}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {adminReports.map(report => (
              <div key={report.admin.id} style={{ borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div onClick={() => setExpandedAdmin(expandedAdmin === report.admin.id ? null : report.admin.id)} style={{ padding: '18px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(201,168,76,0.15)', border: '2px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>🛡️</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{report.admin.name}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{report.teamSales.length} سيلز تحته · {report.total} ليد إجمالي</p>
                  </div>
                  <div style={{ textAlign: 'left', minWidth: '110px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#00ff88', margin: 0 }}>{report.wonValue.toLocaleString()} ج</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>مبيعات مغلقة</p>
                  </div>
                  <div style={{ textAlign: 'left', minWidth: '90px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#4A90D9', margin: 0 }}>{Math.round(report.pipelineValue).toLocaleString()} ج</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>pipeline</p>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: '60px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#C9A84C', margin: 0 }}>{report.conversion}%</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>تحويل</p>
                  </div>
                  <div style={{ height: '30px', width: '110px' }}>
                    <div style={{ height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: '12px' }}>
                      <div style={{ height: '100%', borderRadius: '50px', backgroundColor: '#9B59B6', width: `${(report.wonValue / maxAdminValue) * 100}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>{expandedAdmin === report.admin.id ? '▲' : '▼'}</span>
                </div>

                {expandedAdmin === report.admin.id && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px' }}>
                      <thead>
                        <tr>
                          {(locale === 'ar' ? ['السيلز', 'إجمالي', 'مبيعات', 'قيمة المبيعات', 'Pipeline', 'تحويل'] : ['Sales Rep', 'Total', 'Sales', 'Sales Value', 'Pipeline', 'Conversion']).map(h => (
                            <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ backgroundColor: 'rgba(155,89,182,0.05)' }}>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#9B59B6', fontWeight: 700 }}>{report.admin.name} (شخصي)</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>{report.adminOwnStats.total}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#00ff88' }}>{report.adminOwnStats.won}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#00ff88' }}>{report.adminOwnStats.wonValue.toLocaleString()} ج</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#4A90D9' }}>{Math.round(report.adminOwnStats.pipelineValue).toLocaleString()} ج</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: '#C9A84C' }}>{report.adminOwnStats.conversion}%</td>
                        </tr>
                        {report.teamSales.map(s => {
                          const stats = calcUserStats(s.id);
                          return (
                            <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: 'white' }}>{s.name}</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px' }}>{stats.total}</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#00ff88' }}>{stats.won}</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#00ff88' }}>{stats.wonValue.toLocaleString()} ج</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#4A90D9' }}>{Math.round(stats.pipelineValue).toLocaleString()} ج</td>
                              <td style={{ padding: '10px 12px', fontSize: '13px', color: '#C9A84C' }}>{stats.conversion}%</td>
                            </tr>
                          );
                        })}
                        {report.teamSales.length === 0 && (
                          <tr><td colSpan={6} style={{ padding: '14px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>لا يوجد سيلز تحت هذا الأدمن</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unassigned Sales / All Sales for admin view */}
      {(isSuperAdmin ? unassignedSales : allSales).length > 0 && (
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#C9A84C' }}>
            👥 {isSuperAdmin ? (locale === 'ar' ? 'سيلز غير مرتبطين بأدمن' : 'Unassigned Sales') : (locale === 'ar' ? 'أداء السيلز' : 'Sales Performance')}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {(locale === 'ar' ? ['السيلز', 'إجمالي الليدز', 'مبيعات', 'قيمة المبيعات', 'Pipeline', 'نسبة التحويل'] : ['Sales Rep', 'Total Leads', 'Sales', 'Sales Value', 'Pipeline', 'Conversion Rate']).map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(isSuperAdmin ? unassignedSales : allSales).map(s => {
                const stats = calcUserStats(s.id);
                return (
                  <tr key={s.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', color: 'white', fontWeight: 600, fontSize: '14px' }}>{s.name}</td>
                    <td style={{ padding: '14px 16px', color: 'white', fontWeight: 700 }}>{stats.total}</td>
                    <td style={{ padding: '14px 16px', color: '#00ff88', fontWeight: 700 }}>{stats.won}</td>
                    <td style={{ padding: '14px 16px', color: '#00ff88', fontWeight: 700 }}>{stats.wonValue.toLocaleString()} ج</td>
                    <td style={{ padding: '14px 16px', color: '#4A90D9', fontWeight: 700 }}>{Math.round(stats.pipelineValue).toLocaleString()} ج</td>
                    <td style={{ padding: '14px 16px', color: '#C9A84C', fontWeight: 700 }}>{stats.conversion}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sales Commissions */}
      {isSuperAdmin && (
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#C9A84C' }}>
            {locale === 'ar' ? '💰 عمولات السيلز' : '💰 Sales Commissions'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '16px' }}>
            {locale === 'ar' ? 'العمولة 2.5% من قيمة الصفقات المغلقة' : 'Commission: 2.5% of closed deal value'}
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                {(locale === 'ar' ? ['السيلز', 'الصفقات المغلقة', 'قيمة المبيعات', 'العمولة المستحقة'] : ['Sales Rep', 'Closed Deals', 'Sales Value', 'Commission Due']).map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: locale === 'ar' ? 'right' : 'left', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...admins, ...allSales].map(u => {
                const stats = calcUserStats(u.id);
                if (stats.won === 0) return null;
                const commission = Math.round(stats.wonValue * 0.025);
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px 16px', color: 'white', fontWeight: 600, fontSize: '14px' }}>{u.name}</td>
                    <td style={{ padding: '14px 16px', color: '#00ff88', fontWeight: 700 }}>{stats.won}</td>
                    <td style={{ padding: '14px 16px', color: '#00ff88', fontWeight: 700 }}>{stats.wonValue.toLocaleString()} {locale === 'ar' ? 'ج' : 'EGP'}</td>
                    <td style={{ padding: '14px 16px', color: '#C9A84C', fontWeight: 700, fontSize: '15px' }}>{commission.toLocaleString()} {locale === 'ar' ? 'ج' : 'EGP'}</td>
                  </tr>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{locale === 'ar' ? 'إجمالي العمولات المستحقة' : 'Total Commissions Due'}</span>
            <span style={{ color: '#C9A84C', fontSize: '20px', fontWeight: 800 }}>
              {Math.round([...admins, ...allSales].reduce((s, u) => s + calcUserStats(u.id).wonValue * 0.025, 0)).toLocaleString()} {locale === 'ar' ? 'ج' : 'EGP'}
            </span>
          </div>
        </div>
      )}

      {/* Project Reports */}
      {isSuperAdmin && projects.length > 0 && (
        <div style={{ padding: '28px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#E67E22' }}>{locale === 'ar' ? '🏢 تقرير المشاريع' : '🏢 Project Reports'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {projects.map(project => {
              const projectLeads = filtered.filter(l => l.assigned_to && leads.find(ll => ll.id === l.id));
              const interestedLeads = leads.filter((l: any) => l.project_id === project.id);
              const projectUnits = units.filter(u => u.project_id === project.id);
              const availableUnits = projectUnits.filter(u => u.status === 'available').length;
              const soldUnits = projectUnits.filter(u => u.status === 'sold').length;
              const reservedUnits = projectUnits.filter(u => u.status === 'reserved').length;
              const soldValue = projectUnits.filter(u => u.status === 'sold').reduce((s: number, u: any) => s + (u.price || 0), 0);
              const occupancy = projectUnits.length > 0 ? Math.round(((soldUnits + reservedUnits) / projectUnits.length) * 100) : 0;

              return (
                <div key={project.id} style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: '0 0 14px' }}>🏗️ {project.name_ar}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.08)' }}>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#4A90D9', margin: 0 }}>{interestedLeads.length}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>ليد مهتم</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(0,255,136,0.08)' }}>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#00ff88', margin: 0 }}>{soldUnits}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>وحدة مباعة</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    <span>متاح: {availableUnits}</span>
                    <span>محجوز: {reservedUnits}</span>
                    <span>إجمالي: {projectUnits.length}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>نسبة الإشغال</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: occupancy >= 70 ? '#00ff88' : '#F39C12' }}>{occupancy}%</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '50px', backgroundColor: occupancy >= 70 ? '#00ff88' : '#F39C12', width: `${occupancy}%` }} />
                    </div>
                  </div>
                  {soldValue > 0 && (
                    <p style={{ fontSize: '12px', color: '#00ff88', fontWeight: 700, margin: 0, textAlign: 'center' }}>💰 {soldValue.toLocaleString()} ج مبيعات</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}