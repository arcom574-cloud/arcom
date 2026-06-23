'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

type Integration = {
  id: string; platform: string; access_token: string;
  account_id: string; active: boolean; last_sync: string;
};

const platformInfo: Record<string, { label: string; icon: string; color: string; fields: { key: string; label: string; placeholder: string }[] }> = {
  facebook: {
    label: 'Facebook & Instagram Lead Ads',
    icon: '📘',
    color: '#1877F2',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAxxxxxxxxxxxx' },
      { key: 'account_id', label: 'Page/Form ID', placeholder: '1234567890' },
    ],
  },
  google: {
    label: 'Google Ads Lead Forms',
    icon: '🔴',
    color: '#EA4335',
    fields: [
      { key: 'access_token', label: 'OAuth Access Token', placeholder: 'ya29.xxxxxxxxxxxx' },
      { key: 'account_id', label: 'Customer ID', placeholder: '123-456-7890' },
    ],
  },
};

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ access_token: '', account_id: '' });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [formMappings, setFormMappings] = useState<any[]>([]);
  const [newMapping, setNewMapping] = useState({ form_id: '', branch_id: '', platform: 'facebook', label: '' });

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      if (u.role !== 'superadmin') window.location.href = '/crm';
    }
  }, []);

  const load = async () => {
    const { data } = await supabaseAdmin.from('ad_integrations').select('*');
    if (data) setIntegrations(data);
    const { data: branchData } = await supabaseAdmin.from('branches').select('*');
    if (branchData) setBranches(branchData);
    const { data: mappingData } = await supabaseAdmin.from('ad_form_branches').select('*, branches(name)');
    if (mappingData) setFormMappings(mappingData);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform);

  const startEdit = (platform: string) => {
    const existing = getIntegration(platform);
    setForm({
      access_token: existing?.access_token || '',
      account_id: existing?.account_id || '',
    });
    setEditing(platform);
  };

  const handleSave = async (platform: string) => {
    setSaving(true);
    const existing = getIntegration(platform);

    if (existing) {
      await supabaseAdmin.from('ad_integrations').update({
        access_token: form.access_token,
        account_id: form.account_id,
        active: true,
      }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('ad_integrations').insert({
        platform,
        access_token: form.access_token,
        account_id: form.account_id,
        active: true,
      });
    }

    setSaving(false);
    setEditing(null);
    setForm({ access_token: '', account_id: '' });
    load();
  };

  const handleToggleActive = async (integration: Integration) => {
    await supabaseAdmin.from('ad_integrations').update({ active: !integration.active }).eq('id', integration.id);
    load();
  };

  const handleDisconnect = async (integration: Integration) => {
    await supabaseAdmin.from('ad_integrations').delete().eq('id', integration.id);
    load();
  };

  const handleSync = async (platform: string) => {
    setSyncing(platform);
    setSyncResult(null);
    try {
      const res = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`تم مزامنة ${data.synced} ليد جديد`);
        load();
      } else {
        setSyncResult(`خطأ: ${data.details || data.error}`);
      }
    } catch {
      setSyncResult('خطأ في الاتصال');
    }
    setSyncing(null);
  };

  const maskToken = (token: string) => {
    if (!token) return '';
    if (token.length <= 8) return '••••••••';
    return token.slice(0, 6) + '••••••••' + token.slice(-4);
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif',
    outline: 'none', boxSizing: 'border-box' as const, direction: 'ltr' as const,
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>;

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>إعدادات ربط الإعلانات</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>ربط حسابات Facebook وGoogle Ads لاستقبال الليدز تلقائياً</p>
      </div>

      <div style={{ backgroundColor: 'rgba(74,144,217,0.06)', border: '1px solid rgba(74,144,217,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '28px' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, lineHeight: 1.8 }}>
          💡 لازم تجيب الـ Access Token من Meta Business Manager أو Google Ads Manager الأول. بعد الحفظ، النظام هيبدأ يستقبل الليدز الجديدة من الفورمات بتاعتك تلقائياً.
          <br /><br />
          🔗 <strong>Facebook Webhook (بدون فرع):</strong> <span style={{ direction: 'ltr', display: 'inline' }}>https://www.arcomdevelopments.com/api/webhooks/facebook</span>
          <br />
          🔗 <strong>Facebook (الفرع الرئيسي):</strong> <span style={{ direction: 'ltr', display: 'inline' }}>https://www.arcomdevelopments.com/api/webhooks/facebook?branch=الفرع الرئيسي</span>
          <br />
          🔗 <strong>Facebook (الفرع الثاني):</strong> <span style={{ direction: 'ltr', display: 'inline' }}>https://www.arcomdevelopments.com/api/webhooks/facebook?branch=الفرع الثاني</span>
          <br /><br />
          🔗 <strong>Google Webhook (بدون فرع):</strong> <span style={{ direction: 'ltr', display: 'inline' }}>https://www.arcomdevelopments.com/api/webhooks/google</span>
          <br />
          🔗 <strong>Google (الفرع الرئيسي):</strong> <span style={{ direction: 'ltr', display: 'inline' }}>https://www.arcomdevelopments.com/api/webhooks/google?branch=الفرع الرئيسي</span>
          <br />
          🔗 <strong>Google (الفرع الثاني):</strong> <span style={{ direction: 'ltr', display: 'inline' }}>https://www.arcomdevelopments.com/api/webhooks/google?branch=الفرع الثاني</span>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Object.entries(platformInfo).map(([key, info]) => {
          const integration = getIntegration(key);
          const isEditing = editing === key;

          return (
            <div key={key} style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? '24px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${info.color}15`, border: `1px solid ${info.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    {info.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{info.label}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {integration ? (
                        <>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: integration.active ? '#25D366' : '#888' }} />
                          <span style={{ fontSize: '12px', color: integration.active ? '#25D366' : 'rgba(255,255,255,0.4)' }}>
                            {integration.active ? 'متصل ونشط' : 'متصل (معطل)'}
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>غير متصل</span>
                      )}
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {integration && (
                      <>
                        {integration.active && key === 'facebook' && (
                          <button onClick={() => handleSync(key)} disabled={syncing === key} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                            {syncing === key ? '⏳ جاري المزامنة...' : '🔄 مزامنة الآن'}
                          </button>
                        )}
                        <button onClick={() => handleToggleActive(integration)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: integration.active ? 'rgba(255,68,68,0.1)' : 'rgba(37,211,102,0.1)', border: `1px solid ${integration.active ? 'rgba(255,68,68,0.3)' : 'rgba(37,211,102,0.3)'}`, color: integration.active ? '#ff4444' : '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                          {integration.active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => handleDisconnect(integration)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                          فصل الاتصال
                        </button>
                      </>
                    )}
                    <button onClick={() => startEdit(key)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                      {integration ? 'تعديل البيانات' : '+ ربط الحساب'}
                    </button>
                  </div>
                )}
              </div>

              {syncResult && !isEditing && integration && key === 'facebook' && (
                <div style={{ marginTop: '12px', padding: '10px 16px', borderRadius: '10px', backgroundColor: syncResult.startsWith('خطأ') ? 'rgba(255,68,68,0.1)' : 'rgba(37,211,102,0.1)', border: `1px solid ${syncResult.startsWith('خطأ') ? 'rgba(255,68,68,0.2)' : 'rgba(37,211,102,0.2)'}` }}>
                  <p style={{ color: syncResult.startsWith('خطأ') ? '#ff4444' : '#25D366', fontSize: '13px', margin: 0 }}>{syncResult}</p>
                </div>
              )}

              {!isEditing && integration && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '32px' }}>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 4px' }}>Access Token</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, direction: 'ltr' }}>{maskToken(integration.access_token)}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 4px' }}>Account/Form ID</p>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, direction: 'ltr' }}>{integration.account_id || '-'}</p>
                  </div>
                  {integration.last_sync && (
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '0 0 4px' }}>آخر مزامنة</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>{integration.last_sync.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                  )}
                </div>
              )}

              {isEditing && (
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {info.fields.map(field => (
                      <div key={field.key}>
                        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                        <input
                          value={(form as any)[field.key]}
                          onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button onClick={() => { setEditing(null); setForm({ access_token: '', account_id: '' }); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
                    <button onClick={() => handleSave(key)} disabled={saving || !form.access_token} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: info.color, border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                      {saving ? 'جاري الحفظ...' : '💾 حفظ والاتصال'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form → Branch Mapping */}
      {branches.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>🔗 ربط الفورمات بالفروع</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '20px' }}>
            حط Form ID أو Campaign ID من فيسبوك أو جوجل وحدد الفرع — الليدز هتروح للفرع الصح أوتوماتيك
          </p>

          {/* Existing Mappings */}
          {formMappings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {formMappings.map((m: any) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span style={{ fontSize: '16px' }}>{m.platform === 'facebook' ? '📘' : '🔴'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', margin: '0 0 2px' }}>{m.label || m.form_id}</p>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: 0, direction: 'ltr' }}>ID: {m.form_id}</p>
                  </div>
                  <span style={{ backgroundColor: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.3)', borderRadius: '50px', padding: '3px 12px', fontSize: '11px', color: '#9B59B6' }}>
                    🏢 {(m.branches as any)?.name || ''}
                  </span>
                  <button onClick={async () => { await supabaseAdmin.from('ad_form_branches').delete().eq('id', m.id); load(); }} style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px' }}>حذف</button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Mapping */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>المنصة</label>
              <select value={newMapping.platform} onChange={e => setNewMapping({ ...newMapping, platform: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="facebook" style={{ backgroundColor: '#0A0F1A' }}>📘 Facebook</option>
                <option value="google" style={{ backgroundColor: '#0A0F1A' }}>🔴 Google</option>
              </select>
            </div>
            <div style={{ flex: 2, minWidth: '180px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Form / Campaign ID</label>
              <input value={newMapping.form_id} onChange={e => setNewMapping({ ...newMapping, form_id: e.target.value })} placeholder="1234567890" style={{ ...inputStyle, direction: 'ltr' }} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>اسم (اختياري)</label>
              <input value={newMapping.label} onChange={e => setNewMapping({ ...newMapping, label: e.target.value })} placeholder="مثلاً: إعلان برج الأعمال" style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>الفرع</label>
              <select value={newMapping.branch_id} onChange={e => setNewMapping({ ...newMapping, branch_id: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="" style={{ backgroundColor: '#0A0F1A' }}>اختر فرع</option>
                {branches.map((b: any) => <option key={b.id} value={b.id} style={{ backgroundColor: '#0A0F1A' }}>🏢 {b.name}</option>)}
              </select>
            </div>
            <button onClick={async () => {
              if (!newMapping.form_id || !newMapping.branch_id) return;
              await supabaseAdmin.from('ad_form_branches').insert({
                form_id: newMapping.form_id, branch_id: newMapping.branch_id,
                platform: newMapping.platform, label: newMapping.label,
              });
              setNewMapping({ form_id: '', branch_id: '', platform: 'facebook', label: '' });
              load();
            }} disabled={!newMapping.form_id || !newMapping.branch_id} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
              + إضافة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}