'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

type Notification = {
  id: string; type: string; title: string; message: string;
  read: boolean; lead_id: string; created_at: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [show, setShow] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const load = async () => {
    if (!user) return;
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    if (user) {
      load();
      const interval = setInterval(load, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = async (id: string) => {
    await supabaseAdmin.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await supabaseAdmin.from('notifications').update({ read: true }).eq('user_id', user?.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const typeIcon: Record<string, string> = {
    new_lead: '🆕', reminder: '⏰', transfer: '🔄', target: '🎯', system: '⚙️',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShow(!show)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '8px' }}>
        <span style={{ fontSize: '20px' }}>🔔</span>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: '#ff4444', color: 'white', fontSize: '10px', fontWeight: 700, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div style={{ position: 'absolute', top: '100%', right: 0, width: '340px', maxHeight: '400px', overflowY: 'auto', backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>الإشعارات</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#4A90D9', fontSize: '11px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                قراءة الكل
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>لا يوجد إشعارات</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} onClick={() => { markRead(n.id); if (n.lead_id) window.location.href = `/crm/leads/${n.lead_id}`; }}
                style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', backgroundColor: n.read ? 'transparent' : 'rgba(74,144,217,0.05)' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>{typeIcon[n.type] || '📌'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: n.read ? 400 : 700, color: 'white', margin: '0 0 2px' }}>{n.title}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 2px' }}>{n.message}</p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>{n.created_at?.slice(0, 16).replace('T', ' ')}</p>
                  </div>
                  {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4A90D9', flexShrink: 0, marginTop: '4px' }} />}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
