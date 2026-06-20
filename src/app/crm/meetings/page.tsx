'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type Meeting = {
  id: string; room: string; title: string; lead_id: string | null;
  user_id: string; start_time: string; end_time: string;
  notes: string; created_at: string;
  crm_users?: { name: string }; leads?: { name: string; phone: string };
};

const rooms = [
  { key: 'room_1', label_ar: 'غرفة اجتماعات 1', label_en: 'Meeting Room 1', color: '#4A90D9', icon: '🏢' },
  { key: 'room_2', label_ar: 'غرفة اجتماعات 2', label_en: 'Meeting Room 2', color: '#9B59B6', icon: '🏛️' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

export default function MeetingsPage() {
  const { locale, dir } = useCrmLocale();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ room: 'room_1', title: '', lead_id: '', start_time: '', end_time: '', notes: '' });

  const roomLabel = (room: typeof rooms[number]) => locale === 'ar' ? room.label_ar : room.label_en;

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const load = async () => {
    const stored = localStorage.getItem('crm_user');
    const u = stored ? JSON.parse(stored) : null;
    if (!u) return;

    const dayStart = `${selectedDate}T00:00:00`;
    const dayEnd = `${selectedDate}T23:59:59`;

    const { data } = await supabaseAdmin
      .from('meeting_bookings')
      .select('*, crm_users(name), leads(name, phone)')
      .gte('start_time', dayStart)
      .lte('start_time', dayEnd)
      .order('start_time');
    if (data) setMeetings(data);

    let leadsQuery = supabaseAdmin.from('leads').select('id, name, phone');
    if (u.role === 'sales') leadsQuery = leadsQuery.eq('assigned_to', u.id);
    const { data: leadsData } = await leadsQuery;
    if (leadsData) setLeads(leadsData);

    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedDate]);

  const isSlotBooked = (room: string, time: string) => {
    const slotStart = new Date(`${selectedDate}T${time}:00`);
    return meetings.find(m =>
      m.room === room &&
      new Date(m.start_time) <= slotStart &&
      new Date(m.end_time) > slotStart
    );
  };

  const handleSlotClick = (room: string, time: string) => {
    const existing = isSlotBooked(room, time);
    if (existing) return;
    const endIdx = timeSlots.indexOf(time) + 2;
    const endTime = timeSlots[Math.min(endIdx, timeSlots.length - 1)] || '18:00';
    setForm({ room, title: '', lead_id: '', start_time: `${selectedDate}T${time}`, end_time: `${selectedDate}T${endTime}`, notes: '' });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.start_time || !form.end_time) return;
    setSaving(true);

    const { data: conflicts } = await supabaseAdmin
      .from('meeting_bookings')
      .select('id')
      .eq('room', form.room)
      .lt('start_time', form.end_time)
      .gt('end_time', form.start_time);

    if (conflicts && conflicts.length > 0) {
      alert('الغرفة محجوزة في الوقت ده!');
      setSaving(false);
      return;
    }

    await supabaseAdmin.from('meeting_bookings').insert({
      room: form.room,
      title: form.title || 'اجتماع',
      lead_id: form.lead_id || null,
      user_id: user?.id,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes,
    });

    if (form.lead_id) {
      await supabaseAdmin.from('lead_activities').insert({
        lead_id: form.lead_id, user_id: user?.id, type: 'meeting',
        description: `تم حجز اجتماع: ${rooms.find(r => r.key === form.room)?.label_ar} - ${form.start_time.slice(11, 16)}`,
      });
    }

    setSaving(false);
    setShowAdd(false);
    setForm({ room: 'room_1', title: '', lead_id: '', start_time: '', end_time: '', notes: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    await supabaseAdmin.from('meeting_bookings').delete().eq('id', id);
    load();
  };

  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  const dayLabel = new Date(selectedDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const,
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>{t('loading', locale)}</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: dir }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{locale === 'ar' ? 'حجز غرف الاجتماعات' : 'Meeting Room Booking'}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{locale === 'ar' ? 'اضغط على خانة فاضية لحجز اجتماع' : 'Click an empty slot to book a meeting'}</p>
        </div>
        <button onClick={() => { setForm({ room: 'room_1', title: '', lead_id: '', start_time: '', end_time: '', notes: '' }); setShowAdd(true); }} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          {locale === 'ar' ? '+ حجز اجتماع' : '+ Book Meeting'}
        </button>
      </div>

      {/* Date Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigateDay(-1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' }}>→</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px', color: isToday ? '#4A90D9' : 'white' }}>{dayLabel}</p>
          {isToday && <span style={{ fontSize: '11px', color: '#4A90D9' }}>{t('today', locale)}</span>}
        </div>
        <button onClick={() => navigateDay(1)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' }}>←</button>
        {!isToday && (
          <button onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))} style={{ background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', borderRadius: '8px', color: '#4A90D9', padding: '8px 14px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>{t('today', locale)}</button>
        )}
      </div>

      {/* Schedule Grid */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '14px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600, width: '80px' }}>{locale === 'ar' ? 'الوقت' : 'Time'}</th>
              {rooms.map(room => (
                <th key={room.key} style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                  <span style={{ color: room.color }}>{room.icon} {roomLabel(room)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, direction: 'ltr', textAlign: 'center' }}>{time}</td>
                {rooms.map(room => {
                  const booking = isSlotBooked(room.key, time);
                  const isStart = booking && booking.start_time.slice(11, 16) === time;
                  if (booking && !isStart) return <td key={room.key} style={{ padding: '0' }} />;

                  if (booking && isStart) {
                    const startH = parseInt(booking.start_time.slice(11, 13)) * 60 + parseInt(booking.start_time.slice(14, 16));
                    const endH = parseInt(booking.end_time.slice(11, 13)) * 60 + parseInt(booking.end_time.slice(14, 16));
                    const slots = Math.max(1, Math.round((endH - startH) / 30));
                    return (
                      <td key={room.key} rowSpan={slots} style={{ padding: '4px' }}>
                        <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: `${room.color}15`, border: `1px solid ${room.color}30`, height: '100%', position: 'relative' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: room.color, margin: '0 0 2px' }}>{booking.title}</p>
                          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>
                            {booking.start_time.slice(11, 16)} - {booking.end_time.slice(11, 16)}
                          </p>
                          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>
                            👤 {(booking.crm_users as any)?.name}
                          </p>
                          {(booking.leads as any)?.name && (
                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>🤝 {(booking.leads as any).name}</p>
                          )}
                          {(booking.user_id === user?.id || user?.role === 'superadmin') && (
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(booking.id); }}
                              style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '6px', color: '#ff4444', cursor: 'pointer', fontSize: '10px', padding: '2px 6px', fontFamily: 'Cairo, sans-serif' }}>✕</button>
                          )}
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={room.key} style={{ padding: '4px' }}>
                      <div onClick={() => handleSlotClick(room.key, time)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center', minHeight: '36px', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${room.color}08`; e.currentTarget.style.borderColor = `${room.color}30`; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                      >
                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.1)' }}>+</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '16px' }}>
        {rooms.map(room => (
          <div key={room.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: `${room.color}30`, border: `1px solid ${room.color}50` }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{roomLabel(room)}</span>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '480px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>{locale === 'ar' ? 'حجز اجتماع' : 'Book Meeting'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'الغرفة' : 'Room'}</label>
                <select value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {rooms.map(r => <option key={r.key} value={r.key} style={{ backgroundColor: '#0A0F1A' }}>{r.icon} {roomLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'عنوان الاجتماع' : 'Meeting Title'}</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: اجتماع عرض وحدات" style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'العميل (اختياري)' : 'Client (Optional)'}</label>
                <select value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="" style={{ backgroundColor: '#0A0F1A' }}>{locale === 'ar' ? 'بدون عميل' : 'No Client'}</option>
                  {leads.map(l => <option key={l.id} value={l.id} style={{ backgroundColor: '#0A0F1A' }}>{l.name} - {l.phone}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'من *' : 'From *'}</label>
                  <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'إلى *' : 'To *'}</label>
                  <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleSave} disabled={saving || !form.start_time || !form.end_time} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? 'جاري الحجز...' : locale === 'ar' ? '📅 حجز الاجتماع' : '📅 Book Meeting'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
