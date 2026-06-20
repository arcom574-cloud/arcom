'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type Lead = {
  id: string; name: string; phone: string; email: string;
  project_interest: string; source: string; status: string;
  assigned_to: string; budget: string; notes: string; created_at: string;
  crm_users?: { name: string };
};

type Comment = { id: string; comment: string; visible: boolean; created_at: string; crm_users?: { name: string }; user_id: string; };
type Call = { id: string; phone: string; duration: number; recording_url: string; notes: string; created_at: string; crm_users?: { name: string }; };
type Activity = { id: string; type: string; description: string; created_at: string; crm_users?: { name: string }; };
type Reminder = { id: string; reminder_date: string; note: string; done: boolean; };

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

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { locale, dir } = useCrmLocale();
  const [lead, setLead] = useState<Lead | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [newReminder, setNewReminder] = useState({ date: '', note: '' });
  const [newCall, setNewCall] = useState({ duration: '', notes: '', result: '' });
  const [whatsappChat, setWhatsappChat] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitForm, setVisitForm] = useState({ project_id: '', visit_date: '', notes: '' });
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const load = async () => {
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;

    const { data: leadData } = await supabaseAdmin.from('leads').select('*, crm_users(name)').eq('id', id).single();
    if (u?.role === 'sales' && leadData?.assigned_to !== u.id) {
      window.location.href = '/crm/leads';
      return;
    }
    setLead(leadData);
    setEditForm(leadData || {});

    const { data: commentsData } = await supabaseAdmin.from('lead_comments').select('*, crm_users(name)').eq('lead_id', id).order('created_at');
    const visibleComments = u?.role === 'sales'
      ? (commentsData || []).filter((c: Comment) => c.visible)
      : (commentsData || []);
    setComments(visibleComments);

    const { data: callsData } = await supabaseAdmin.from('lead_calls').select('*, crm_users(name)').eq('lead_id', id).order('created_at', { ascending: false });
    setCalls(callsData || []);

    const { data: activitiesData } = await supabaseAdmin.from('lead_activities').select('*, crm_users(name)').eq('lead_id', id).order('created_at', { ascending: false });
    setActivities(activitiesData || []);

    const { data: remindersData } = await supabaseAdmin.from('lead_reminders').select('*').eq('lead_id', id).eq('done', false).order('reminder_date');
    setReminders(remindersData || []);

    if (u?.role !== 'sales') {
      const { data: usersData } = await supabaseAdmin.from('crm_users').select('id, name, role').eq('active', true);
      setUsers(usersData || []);
    }

    let unitsQuery = supabaseAdmin
      .from('project_units')
      .select('*, projects(name_ar)')
      .eq('status', 'available')
      .order('project_id');
    if (leadData?.project_id) {
      unitsQuery = supabaseAdmin
        .from('project_units')
        .select('*, projects(name_ar)')
        .eq('status', 'available')
        .eq('project_id', leadData.project_id)
        .order('unit_number');
    }
    const { data: unitsData } = await unitsQuery;
    setAvailableUnits(unitsData || []);

    const { data: projectsData } = await supabaseAdmin.from('projects').select('id, name_ar').eq('active', true);
    setProjects(projectsData || []);

    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSaving(true);
    await supabaseAdmin.from('lead_comments').insert({ lead_id: id, user_id: user?.id, comment: newComment });
    await supabaseAdmin.from('lead_activities').insert({ lead_id: id, user_id: user?.id, type: 'comment', description: 'تم إضافة تعليق' });
    if (lead?.status === 'new') {
      await supabaseAdmin.from('leads').update({ status: 'contacted', last_contact_at: new Date().toISOString() }).eq('id', id);
    }
    setNewComment('');
    setSaving(false);
    load();
  };

  const handleAddReminder = async () => {
    if (!newReminder.date) return;
    await supabaseAdmin.from('lead_reminders').insert({ lead_id: id, user_id: user?.id, reminder_date: newReminder.date, note: newReminder.note });
    setNewReminder({ date: '', note: '' });
    load();
  };

  const handleAddCall = async () => {
    if (!newCall.notes.trim()) return;
    setSaving(true);
    await supabaseAdmin.from('lead_calls').insert({
      lead_id: id, user_id: user?.id, phone: lead?.phone || '',
      duration: newCall.duration ? parseInt(newCall.duration) : null,
      notes: `${newCall.result ? `[${newCall.result}] ` : ''}${newCall.notes}`,
    });
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: id, user_id: user?.id, type: 'call',
      description: `تم تسجيل مكالمة${newCall.result ? ` - ${newCall.result}` : ''}`,
    });
    const statusUpdate: any = { last_contact_at: new Date().toISOString() };
    if (lead?.status === 'new') {
      statusUpdate.status = 'contacted';
    }
    if (newCall.result === 'رد - مهتم' && lead?.status && ['new', 'contacted'].includes(lead.status)) {
      statusUpdate.status = 'interested';
    }
    await supabaseAdmin.from('leads').update(statusUpdate).eq('id', id);
    setNewCall({ duration: '', notes: '', result: '' });
    setSaving(false);
    load();
  };

  const handleAddWhatsappChat = async () => {
    if (!whatsappChat.trim()) return;
    setSaving(true);
    await supabaseAdmin.from('lead_comments').insert({
      lead_id: id, user_id: user?.id,
      comment: `💬 محادثة واتساب:\n${whatsappChat}`,
    });
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: id, user_id: user?.id, type: 'whatsapp',
      description: 'تم إضافة محادثة واتساب',
    });
    await supabaseAdmin.from('leads').update({ last_contact_at: new Date().toISOString() }).eq('id', id);
    setWhatsappChat('');
    setSaving(false);
    load();
  };

  const handleDoneReminder = async (reminderId: string) => {
    await supabaseAdmin.from('lead_reminders').update({ done: true }).eq('id', reminderId);
    load();
  };

  const handleStatusChange = async (status: string) => {
    await supabaseAdmin.from('leads').update({ status }).eq('id', id);
    await supabaseAdmin.from('lead_activities').insert({ lead_id: id, user_id: user?.id, type: 'status_change', description: `تغيير الحالة إلى: ${statusLabel[status]}` });
    load();
  };

  const handleScheduleVisit = async () => {
    if (!visitForm.visit_date) return;
    setSaving(true);
    await supabaseAdmin.from('site_visits').insert({
      lead_id: id,
      project_id: visitForm.project_id || null,
      user_id: user?.id,
      visit_date: visitForm.visit_date,
      notes: visitForm.notes,
      status: 'scheduled',
    });
    await supabaseAdmin.from('leads').update({ status: 'site_visit', last_contact_at: new Date().toISOString() }).eq('id', id);
    await supabaseAdmin.from('lead_activities').insert({
      lead_id: id, user_id: user?.id, type: 'site_visit',
      description: `تم جدولة معاينة: ${visitForm.visit_date.replace('T', ' ')}`,
    });
    setSaving(false);
    setShowVisitForm(false);
    setVisitForm({ project_id: '', visit_date: '', notes: '' });
    load();
  };

  const handleSendUnit = (unit: any) => {
    if (!lead) return;
    const projectName = unit.projects?.name_ar || '';
    const unitType: Record<string, string> = { shop: 'محل', office: 'مكتب إداري', cafe: 'كافيه/مطعم', apartment: 'شقة', villa: 'فيلا', duplex: 'دوبلكس', studio: 'استوديو' };
    const msg = `مرحباً ${lead.name}! 🏢\n\nتفاصيل الوحدة المقترحة ليك:\n📍 المشروع: ${projectName}\n🔢 رقم الوحدة: ${unit.unit_number}\n🏠 النوع: ${unitType[unit.unit_type] || unit.unit_type || ''}\n📐 المساحة: ${unit.area} م²\n🏗️ الدور: ${unit.floor || ''}\n🌅 الإطلالة: ${unit.view || ''}\n💰 السعر: ${unit.price?.toLocaleString()} جنيه\n\nلو عايز تفاصيل أكتر أو تحجز معاينة، كلمنا! 📞\n\nArcom Developments`;
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    supabaseAdmin.from('lead_activities').insert({
      lead_id: id, user_id: user?.id, type: 'unit_sent',
      description: `تم إرسال تفاصيل وحدة ${unit.unit_number} - ${projectName} عبر واتساب`,
    });
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await supabaseAdmin.from('leads').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', id);
    setSaving(false);
    setEditing(false);
    load();
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  const parseChatMessages = (notes: string) => {
    const text = notes.replace(/^[\s\S]*?تفاصيل المحادثة:\s*/, '');
    const messages: { isBot: boolean; text: string }[] = [];
    const parts = text.split(/(كريم:|العميل:)/);
    for (let j = 1; j < parts.length; j += 2) {
      const speaker = parts[j];
      const content = (parts[j + 1] || '').trim();
      if (content) {
        messages.push({ isBot: speaker === 'كريم:', text: content });
      }
    }
    return messages;
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;
  if (!lead) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{locale === 'ar' ? 'الليد غير موجود' : 'Lead not found'}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/crm/leads" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '13px' }}>← {t('leads', locale)}</Link>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>{lead.name}</h1>
            <a href={`tel:${lead.phone}`} style={{ color: '#4A90D9', fontSize: '15px', textDecoration: 'none', direction: 'ltr', display: 'block' }}>{lead.phone}</a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={lead.status} onChange={e => handleStatusChange(e.target.value)} style={{ backgroundColor: `${statusColor[lead.status]}20`, border: `1px solid ${statusColor[lead.status]}50`, borderRadius: '50px', padding: '8px 20px', color: statusColor[lead.status], fontSize: '13px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', outline: 'none', fontWeight: 700 }}>
            {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k} style={{ backgroundColor: '#0A0F1A', color: 'white' }}>{v}</option>)}
          </select>
          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" style={{ padding: '8px 20px', borderRadius: '50px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>{t('whatsapp', locale)}</a>
          <a href={`tel:${lead.phone}`} style={{ padding: '8px 20px', borderRadius: '50px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>{t('call', locale)}</a>
          <button onClick={() => setShowVisitForm(true)} style={{ padding: '8px 20px', borderRadius: '50px', backgroundColor: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)', color: '#E67E22', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px', fontWeight: 600 }}>{t('site_visit_btn', locale)}</button>
          {user?.role !== 'sales' && (
            <button onClick={() => setEditing(!editing)} style={{ padding: '8px 20px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px' }}>
              {t('edit', locale)}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>

        {/* Left - Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Edit Form */}
          {editing && (
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74,144,217,0.3)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>تعديل بيانات الليد</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>الاسم</label><input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>التليفون</label><input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ ...inputStyle, direction: 'ltr' }} /></div>
                <div><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>الإيميل</label><input value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ ...inputStyle, direction: 'ltr' }} /></div>
                <div><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>المشروع</label><input value={editForm.project_interest || ''} onChange={e => setEditForm({ ...editForm, project_interest: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>الميزانية</label><input value={editForm.budget || ''} onChange={e => setEditForm({ ...editForm, budget: e.target.value })} style={inputStyle} /></div>
                <div><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>تعيين لـ</label>
                  <select value={editForm.assigned_to || ''} onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="" style={{ backgroundColor: '#0A0F1A' }}>غير محدد</option>
                    {users.map(u => <option key={u.id} value={u.id} style={{ backgroundColor: '#0A0F1A' }}>{u.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}><label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{t('notes', locale)}</label><textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button onClick={() => setEditing(false)} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
                <button onClick={handleSaveEdit} disabled={saving} style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                  {saving ? '...' : t('save', locale)}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { key: 'comments', label: `${t('comments', locale)} (${comments.length})` },
                { key: 'whatsapp', label: t('whatsapp', locale) },
                { key: 'calls', label: `${t('calls_tab', locale)} (${calls.length})` },
                { key: 'reminders', label: `${t('reminders', locale)} (${reminders.length})` },
                { key: 'activity', label: t('activity', locale) },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '14px 20px', backgroundColor: activeTab === tab.key ? 'rgba(27,75,138,0.2)' : 'transparent', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #4A90D9' : '2px solid transparent', color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px', fontWeight: activeTab === tab.key ? 700 : 400 }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '20px' }}>

              {/* Comments */}
              {activeTab === 'comments' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: c.user_id === user?.id ? 'rgba(27,75,138,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${c.user_id === user?.id ? 'rgba(74,144,217,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: '#4A90D9', fontSize: '12px', fontWeight: 600 }}>{(c.crm_users as any)?.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0, lineHeight: 1.7 }}>{c.comment}</p>
                      </div>
                    ))}
                    {comments.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>{t('no_comments', locale)}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={t('write_comment', locale)} rows={2} style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif', outline: 'none', resize: 'none' }} />
                    <button onClick={handleAddComment} disabled={saving || !newComment.trim()} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700, alignSelf: 'flex-end' }}>
                      {t('send', locale)}
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp Chat */}
              {activeTab === 'whatsapp' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {comments.filter(c => c.comment.includes('محادثة واتساب')).map(c => (
                      <div key={c.id} style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#25D366', fontSize: '12px', fontWeight: 600 }}>💬 {(c.crm_users as any)?.name}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                          {c.comment.replace(/^💬 محادثة واتساب:\n?/, '')}
                        </p>
                      </div>
                    ))}
                    {comments.filter(c => c.comment.includes('محادثة واتساب')).length === 0 && (
                      <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>لا يوجد محادثات واتساب مسجلة</p>
                    )}
                  </div>
                  <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)' }}>
                    <p style={{ color: '#25D366', fontSize: '12px', fontWeight: 700, margin: '0 0 10px' }}>
                      {locale === 'ar' ? '⚡ قوالب رسائل سريعة' : '⚡ Quick Message Templates'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {[
                        {
                          label: locale === 'ar' ? '👋 ترحيب' : '👋 Welcome',
                          msg: locale === 'ar'
                            ? `أهلاً ${lead.name}! 😊\nأنا من فريق Arcom Developments.\nتم تخصيص مستشار عقاري ليك لمساعدتك في اختيار أفضل وحدة تجارية.\nعايز تحدد ميعاد للمعاينة؟ 🚗`
                            : `Hi ${lead.name}! 😊\nI'm from Arcom Developments team.\nA dedicated consultant has been assigned to help you find the best commercial unit.\nWould you like to schedule a site visit? 🚗`
                        },
                        {
                          label: locale === 'ar' ? '📞 متابعة' : '📞 Follow-up',
                          msg: locale === 'ar'
                            ? `أهلاً ${lead.name}! 😊\nبتابع معاك بخصوص اهتمامك بمشاريعنا.\nعندنا عروض جديدة ومميزة هتعجبك.\nعايز أعرفك عليها؟ 💰`
                            : `Hi ${lead.name}! 😊\nFollowing up on your interest in our projects.\nWe have new exclusive offers you'll love.\nWould you like to know more? 💰`
                        },
                        {
                          label: locale === 'ar' ? '🏢 عرض وحدة' : '🏢 Unit Offer',
                          msg: locale === 'ar'
                            ? `أهلاً ${lead.name}! 😊\nعندنا وحدة تجارية مميزة هتناسبك:\n📍 الموقع استراتيجي\n💰 السعر تنافسي\n📐 المساحة مناسبة\n\nعايز تفاصيل أكتر أو تحجز معاينة؟ 🚗`
                            : `Hi ${lead.name}! 😊\nWe have an outstanding commercial unit for you:\n📍 Strategic location\n💰 Competitive price\n📐 Perfect area\n\nWould you like more details or to book a visit? 🚗`
                        },
                        {
                          label: locale === 'ar' ? '⏰ تذكير معاينة' : '⏰ Visit Reminder',
                          msg: locale === 'ar'
                            ? `أهلاً ${lead.name}! 😊\nمتنساش ميعاد المعاينة بتاعتك.\nهنكون في انتظارك!\nلو حابب تأجل أو تغير الميعاد، كلمنا. 📞`
                            : `Hi ${lead.name}! 😊\nJust a reminder about your scheduled visit.\nWe're looking forward to seeing you!\nIf you need to reschedule, let us know. 📞`
                        },
                      ].map((tmpl, i) => (
                        <button key={i} onClick={() => {
                          window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(tmpl.msg)}`, '_blank');
                          supabaseAdmin.from('lead_activities').insert({
                            lead_id: id, user_id: user?.id, type: 'whatsapp',
                            description: locale === 'ar' ? `تم إرسال قالب واتساب: ${tmpl.label}` : `WhatsApp template sent: ${tmpl.label}`,
                          });
                          supabaseAdmin.from('leads').update({ last_contact_at: new Date().toISOString() }).eq('id', id);
                        }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(37,211,102,0.1)'; e.currentTarget.style.borderColor = 'rgba(37,211,102,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                        >
                          <span>{tmpl.label}</span>
                          <span style={{ color: '#25D366', fontSize: '14px' }}>📤</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.15)' }}>
                    <p style={{ color: '#25D366', fontSize: '12px', fontWeight: 700, margin: '0 0 10px' }}>📋 لصق محادثة واتساب</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 10px' }}>
                      افتح الشات في الواتساب → اضغط على النقط التلاتة ⋮ → More → Export Chat → بدون ملفات → انسخ والصق هنا
                    </p>
                    <textarea
                      value={whatsappChat}
                      onChange={e => setWhatsappChat(e.target.value)}
                      placeholder="الصق محادثة الواتساب هنا..."
                      rows={6}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', direction: 'ltr' }}
                    />
                    <button onClick={handleAddWhatsappChat} disabled={saving || !whatsappChat.trim()} style={{ marginTop: '10px', width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#25D366', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '14px' }}>
                      {saving ? t('saving', locale) : '💬 حفظ المحادثة'}
                    </button>
                  </div>
                </div>
              )}

              {/* Calls */}
              {activeTab === 'calls' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {calls.map(c => (
                      <div key={c.id} style={{ padding: '14px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>📞 {(c.crm_users as any)?.name || 'غير معروف'}</span>
                            {c.duration && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>({c.duration} دقيقة)</span>}
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{c.created_at?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        {c.notes && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 8px', lineHeight: 1.7 }}>{c.notes}</p>}
                        {c.recording_url && (
                          <audio controls style={{ width: '100%', height: '32px' }}>
                            <source src={c.recording_url} />
                          </audio>
                        )}
                      </div>
                    ))}
                    {calls.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>لا يوجد مكالمات مسجلة</p>}
                  </div>
                  <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(74,144,217,0.04)', border: '1px solid rgba(74,144,217,0.15)' }}>
                    <p style={{ color: '#4A90D9', fontSize: '12px', fontWeight: 700, margin: '0 0 12px' }}>{locale === 'ar' ? '📞 تسجيل مكالمة جديدة' : '📞 Log New Call'}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'مدة المكالمة (دقائق)' : 'Call Duration (min)'}</label>
                        <input type="number" value={newCall.duration} onChange={e => setNewCall({ ...newCall, duration: e.target.value })} placeholder="مثلاً 5" style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'نتيجة المكالمة' : 'Call Result'}</label>
                        <select value={newCall.result} onChange={e => setNewCall({ ...newCall, result: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                          <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر...</option>
                          <option value="رد - مهتم" style={{ backgroundColor: '#0A0F1A' }}>رد - مهتم</option>
                          <option value="رد - غير مهتم" style={{ backgroundColor: '#0A0F1A' }}>رد - غير مهتم</option>
                          <option value="رد - طلب معاودة" style={{ backgroundColor: '#0A0F1A' }}>رد - طلب معاودة</option>
                          <option value="لم يرد" style={{ backgroundColor: '#0A0F1A' }}>لم يرد</option>
                          <option value="الرقم مغلق" style={{ backgroundColor: '#0A0F1A' }}>الرقم مغلق</option>
                          <option value="رقم خاطئ" style={{ backgroundColor: '#0A0F1A' }}>رقم خاطئ</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>{locale === 'ar' ? 'ملخص المكالمة *' : 'Call Summary *'}</label>
                      <textarea value={newCall.notes} onChange={e => setNewCall({ ...newCall, notes: e.target.value })} placeholder="اكتب ايه اللي حصل في المكالمة..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
                    </div>
                    <button onClick={handleAddCall} disabled={saving || !newCall.notes.trim()} style={{ width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '14px' }}>
                      {saving ? t('saving', locale) : locale === 'ar' ? '📞 تسجيل المكالمة' : '📞 Log Call'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reminders */}
              {activeTab === 'reminders' && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {reminders.map(r => (
                      <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}>
                        <div>
                          <p style={{ color: '#C9A84C', fontSize: '12px', margin: '0 0 4px' }}>📅 {r.reminder_date?.slice(0, 16).replace('T', ' ')}</p>
                          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>{r.note}</p>
                        </div>
                        <button onClick={() => handleDoneReminder(r.id)} style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                          تم ✓
                        </button>
                      </div>
                    ))}
                    {reminders.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>لا يوجد تذكيرات</p>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="datetime-local" value={newReminder.date} onChange={e => setNewReminder({ ...newReminder, date: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                    <input value={newReminder.note} onChange={e => setNewReminder({ ...newReminder, note: e.target.value })} placeholder="ملاحظة التذكير" style={inputStyle} />
                    <button onClick={handleAddReminder} style={{ gridColumn: '1/-1', padding: '10px', borderRadius: '10px', backgroundColor: '#C9A84C', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                      + إضافة تذكير
                    </button>
                  </div>
                </div>
              )}

              {/* Activity */}
              {activeTab === 'activity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activities.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4A90D9', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 2px' }}>{a.description}</p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: 0 }}>
                          {(a.crm_users as any)?.name} · {a.created_at?.slice(0, 16).replace('T', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px' }}>لا يوجد نشاط</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right - Lead Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4A90D9', marginBottom: '16px', letterSpacing: '1px' }}>{t('lead_data', locale)}</h3>
            {[
              { label: t('project', locale), value: lead.project_interest },
              { label: locale === 'ar' ? 'الميزانية' : 'Budget', value: lead.budget },
              { label: t('source', locale), value: ({ manual: locale === 'ar' ? 'يدوي' : 'Manual', website: locale === 'ar' ? 'موقع' : 'Website', facebook: locale === 'ar' ? 'فيسبوك' : 'Facebook', whatsapp: locale === 'ar' ? 'واتساب' : 'WhatsApp', chatbot: '🔥 ' + (locale === 'ar' ? 'شات بوت' : 'Chatbot'), google: locale === 'ar' ? 'جوجل' : 'Google' } as Record<string, string>)[lead.source] || lead.source },
              { label: t('responsible', locale), value: (lead.crm_users as any)?.name },
              { label: locale === 'ar' ? 'تاريخ الإضافة' : 'Added Date', value: lead.created_at?.slice(0, 10) },
            ].map(item => item.value ? (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{item.label}</span>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
              </div>
            ) : null)}
          </div>

          {lead.notes && (
            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4A90D9', marginBottom: '12px' }}>
                {/كريم:|العميل:/.test(lead.notes) ? (locale === 'ar' ? '💬 محادثة الشات بوت' : '💬 Chatbot Conversation') : t('notes', locale)}
              </h3>
              {/كريم:|العميل:/.test(lead.notes) && parseChatMessages(lead.notes).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingLeft: '4px' }}>
                  {parseChatMessages(lead.notes).map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.isBot ? 'flex-start' : 'flex-end' }}>
                      <div style={{
                        maxWidth: '85%',
                        padding: '10px 14px',
                        borderRadius: msg.isBot ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                        backgroundColor: msg.isBot ? 'rgba(74,144,217,0.12)' : 'rgba(37,211,102,0.12)',
                        border: `1px solid ${msg.isBot ? 'rgba(74,144,217,0.25)' : 'rgba(37,211,102,0.25)'}`,
                      }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: msg.isBot ? '#4A90D9' : '#25D366', margin: '0 0 4px' }}>
                          {msg.isBot ? '🤖 كريم' : '👤 العميل'}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: 1.8, margin: 0 }}>{lead.notes}</p>
              )}
            </div>
          )}

          {lead.email && (
            <div style={{ padding: '16px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <a href={`mailto:${lead.email}`} style={{ color: '#4A90D9', fontSize: '13px', textDecoration: 'none' }}>✉️ {lead.email}</a>
            </div>
          )}

          {/* Send Unit Details */}
          {availableUnits.length > 0 && (
            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#25D366', marginBottom: '12px' }}>{t('send_unit', locale)}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {availableUnits.slice(0, 10).map((unit: any) => (
                  <div key={unit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'white', margin: '0 0 2px' }}>{unit.projects?.name_ar} - {unit.unit_number}</p>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{unit.area}م² · {unit.price?.toLocaleString()} ج</p>
                    </div>
                    <button onClick={() => handleSendUnit(unit)} style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '10px' }}>
                      📤 إرسال
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {showVisitForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '460px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{locale === 'ar' ? '🚗 جدولة معاينة' : '🚗 Schedule Visit'} {locale === 'ar' ? 'لـ' : 'for'} {lead.name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px' }}>هيتم تحديث حالة الليد لـ "زيارة ميدانية" تلقائياً</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>المشروع</label>
                <select value={visitForm.project_id} onChange={e => setVisitForm({ ...visitForm, project_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر مشروع</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id} style={{ backgroundColor: '#0A0F1A' }}>{p.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>تاريخ ووقت المعاينة *</label>
                <input type="datetime-local" value={visitForm.visit_date} onChange={e => setVisitForm({ ...visitForm, visit_date: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>ملاحظات</label>
                <textarea value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} rows={2} placeholder="مثلاً: العميل عايز يشوف الدور التالت" style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowVisitForm(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleScheduleVisit} disabled={saving || !visitForm.visit_date} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#E67E22', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? t('saving', locale) : locale === 'ar' ? '🚗 تأكيد المعاينة' : '🚗 Confirm Visit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}