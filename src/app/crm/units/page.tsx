'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type Project = { id: string; name_ar: string; slug: string; };
type Unit = {
  id: string; project_id: string; unit_number: string; floor: string;
  area: number; price: number; status: string; unit_type: string;
  view: string; notes: string; lead_id: string | null;
  created_at: string; projects?: { name_ar: string }; leads?: { name: string; phone: string };
};

const statusLabel: Record<string, string> = {
  available: 'متاح', reserved: 'محجوز', sold: 'مباع',
};
const statusColor: Record<string, string> = {
  available: '#25D366', reserved: '#F39C12', sold: '#ff4444',
};
const unitTypeLabel: Record<string, string> = {
  shop: 'محل تجاري', office: 'مكتب إداري', cafe: 'كافيه/مطعم',
  pharmacy: 'صيدلية', clinic: 'عيادة', restaurant: 'مطعم', kiosk: 'كشك',
};

export default function UnitsPage() {
  const { locale, dir } = useCrmLocale();
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    project_id: '', unit_number: '', floor: '', area: '',
    price: '', status: 'available', unit_type: '', view: '', notes: '',
  });

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.role === 'sales') window.location.href = '/crm';
    }
  }, []);

  const load = async () => {
    const { data: unitsData } = await supabaseAdmin
      .from('project_units')
      .select('*, projects(name_ar), leads(name, phone)')
      .order('project_id').order('unit_number');
    if (unitsData) setUnits(unitsData);

    const { data: projectsData } = await supabaseAdmin
      .from('projects').select('id, name_ar, slug').eq('active', true).order('order_num');
    if (projectsData) setProjects(projectsData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.project_id || !form.unit_number) return;
    setSaving(true);
    const payload = {
      project_id: form.project_id,
      unit_number: form.unit_number,
      floor: form.floor,
      area: +form.area || 0,
      price: +form.price || 0,
      status: form.status,
      unit_type: form.unit_type,
      view: form.view,
      notes: form.notes,
    };

    if (editingId) {
      await supabaseAdmin.from('project_units').update(payload).eq('id', editingId);
    } else {
      await supabaseAdmin.from('project_units').insert(payload);
    }

    setSaving(false);
    setShowAdd(false);
    setEditingId(null);
    setForm({ project_id: '', unit_number: '', floor: '', area: '', price: '', status: 'available', unit_type: '', view: '', notes: '' });
    load();
  };

  const handleEdit = (unit: Unit) => {
    setForm({
      project_id: unit.project_id, unit_number: unit.unit_number, floor: unit.floor || '',
      area: String(unit.area || ''), price: String(unit.price || ''), status: unit.status,
      unit_type: unit.unit_type || '', view: unit.view || '', notes: unit.notes || '',
    });
    setEditingId(unit.id);
    setShowAdd(true);
  };

  const handleStatusChange = async (unitId: string, status: string) => {
    const update: any = { status };
    if (status === 'reserved') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 14);
      update.reservation_expiry = expiryDate.toISOString();
    } else {
      update.reservation_expiry = null;
    }
    await supabaseAdmin.from('project_units').update(update).eq('id', unitId);
    load();
  };

  const isExpiringSoon = (unit: Unit) => {
    if (unit.status !== 'reserved' || !(unit as any).reservation_expiry) return false;
    const expiry = new Date((unit as any).reservation_expiry);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3;
  };

  const getExpiryText = (unit: Unit) => {
    if (!(unit as any).reservation_expiry) return '';
    const expiry = new Date((unit as any).reservation_expiry);
    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'منتهي!';
    if (daysLeft === 0) return 'ينتهي اليوم';
    return `${daysLeft} يوم متبقي`;
  };

  const handleSendWhatsApp = (unit: Unit, phone: string) => {
    const projectName = (unit.projects as any)?.name_ar || '';
    const msg = `مرحباً! 🏢\n\nتفاصيل الوحدة:\n📍 المشروع: ${projectName}\n🔢 رقم الوحدة: ${unit.unit_number}\n📐 المساحة: ${unit.area} م²\n💰 السعر: ${unit.price?.toLocaleString()} جنيه\n🏠 النوع: ${unitTypeLabel[unit.unit_type] || unit.unit_type}\n🏗️ الدور: ${unit.floor}\n🌅 الإطلالة: ${unit.view}\n\nArcom Developments`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = units.filter(u => {
    const matchProject = filterProject === 'all' || u.project_id === filterProject;
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchProject && matchStatus;
  });

  const stats = {
    total: filtered.length,
    available: filtered.filter(u => u.status === 'available').length,
    reserved: filtered.filter(u => u.status === 'reserved').length,
    sold: filtered.filter(u => u.status === 'sold').length,
    totalValue: filtered.reduce((s, u) => s + (u.price || 0), 0),
    soldValue: filtered.filter(u => u.status === 'sold').reduce((s, u) => s + (u.price || 0), 0),
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{t('unit_management', locale)}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>إدارة وحدات المشاريع وحالتها</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm({ project_id: '', unit_number: '', floor: '', area: '', price: '', status: 'available', unit_type: '', view: '', notes: '' }); setShowAdd(true); }} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          {t('add_unit', locale)}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(74,144,217,0.08)', border: '1px solid rgba(74,144,217,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{t('total_units', locale)}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#4A90D9', margin: 0 }}>{stats.total}</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{t('available', locale)}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#25D366', margin: 0 }}>{stats.available}</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{t('reserved', locale)}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#F39C12', margin: 0 }}>{stats.reserved}</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{t('sold', locale)}</p>
          <p style={{ fontSize: '24px', fontWeight: 900, color: '#ff4444', margin: 0 }}>{stats.sold}</p>
        </div>
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>{t('sold_value', locale)}</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: '#00ff88', margin: 0 }}>{stats.soldValue.toLocaleString()} ج</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ ...inputStyle, width: '200px', cursor: 'pointer' }}>
          <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{t('all_projects', locale)}</option>
          {projects.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#0A0F1A' }}>{p.name_ar}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: '150px', cursor: 'pointer' }}>
          <option value="all" style={{ backgroundColor: '#0A0F1A' }}>{t('all_statuses', locale)}</option>
          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              {[t('project', locale), t('unit_number', locale), t('unit_type', locale), t('floor', locale), t('area', locale), t('price', locale), t('status', locale), t('client', locale), t('actions', locale)].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(unit => (
              <tr key={unit.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600 }}>{(unit.projects as any)?.name_ar || '-'}</td>
                <td style={{ padding: '12px 14px', fontSize: '13px', color: '#4A90D9', fontWeight: 700 }}>{unit.unit_number}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{unitTypeLabel[unit.unit_type] || unit.unit_type || '-'}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{unit.floor || '-'}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px' }}>{unit.area ? `${unit.area} م²` : '-'}</td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: '#C9A84C', fontWeight: 700 }}>{unit.price ? `${unit.price.toLocaleString()} ج` : '-'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <select value={unit.status} onChange={e => handleStatusChange(unit.id, e.target.value)} style={{ backgroundColor: `${statusColor[unit.status]}20`, border: `1px solid ${statusColor[unit.status]}40`, borderRadius: '50px', padding: '4px 10px', color: statusColor[unit.status], fontSize: '11px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', outline: 'none' }}>
                      {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A', color: 'white' }}>{v}</option>)}
                    </select>
                    {unit.status === 'reserved' && getExpiryText(unit) && (
                      <span style={{ fontSize: '10px', color: isExpiringSoon(unit) ? '#ff4444' : 'rgba(255,255,255,0.4)', fontWeight: isExpiringSoon(unit) ? 700 : 400 }}>
                        ⏳ {getExpiryText(unit)}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  {(unit.leads as any)?.name || '-'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleEdit(unit)} style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>تعديل</button>
                    {(unit.leads as any)?.phone && (
                      <button onClick={() => handleSendWhatsApp(unit, (unit.leads as any).phone)} style={{ padding: '5px 10px', borderRadius: '6px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>إرسال</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>{t('no_leads', locale)}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>{editingId ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>المشروع *</label>
                <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر مشروع</option>
                  {projects.map(p => <option key={p.id} value={p.id} style={{ backgroundColor: '#0A0F1A' }}>{p.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>رقم الوحدة *</label>
                <input value={form.unit_number} onChange={e => setForm({ ...form, unit_number: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>نوع الوحدة</label>
                <select value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر النوع</option>
                  {Object.entries(unitTypeLabel).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A' }}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>الدور</label>
                <input value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} placeholder="مثلاً: الدور 3" style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>المساحة (م²)</label>
                <input type="number" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>السعر (جنيه)</label>
                <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>الإطلالة</label>
                <input value={form.view} onChange={e => setForm({ ...form, view: e.target.value })} placeholder="مثلاً: حديقة، شارع رئيسي" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleSave} disabled={saving || !form.project_id || !form.unit_number} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? t('saving', locale) : editingId ? '💾 تحديث' : '💾 حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
