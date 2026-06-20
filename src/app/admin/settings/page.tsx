'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        const obj: Record<string, string> = {};
        data.forEach((row: any) => { obj[row.key] = row.value; });
        setSettings(obj);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const uploadImage = async (file: File, settingKey: string) => {
    setUploading(settingKey);
    const ext = file.name.split('.').pop();
    const path = `settings/${settingKey}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      const newUrl = data.publicUrl;
      setSettings(prev => ({ ...prev, [settingKey]: newUrl }));
      await supabase.from('settings').upsert({ key: settingKey, value: newUrl, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setUploading('');
  };

  const ImageUploader = ({ settingKey, label }: { settingKey: string, label: string }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={settings[settingKey] || ''} onChange={e => setSettings({ ...settings, [settingKey]: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="https://..." />
          <button onClick={() => ref.current?.click()} style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)', color: '#4A90D9', cursor: 'pointer', fontSize: '13px', fontFamily: 'Cairo, sans-serif', whiteSpace: 'nowrap' }}>
            {uploading === settingKey ? '...' : '📁 رفع'}
          </button>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], settingKey)} />
        </div>
        {settings[settingKey] && (
          <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', height: '80px', position: 'relative' }}>
            <img src={settings[settingKey]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>
    );
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '14px',
    fontFamily: 'Cairo, sans-serif', outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.5)', fontSize: '12px',
    letterSpacing: '1px', display: 'block', marginBottom: '6px',
  };

  const sectionStyle = {
    padding: '32px', borderRadius: '20px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  };

  if (loading) return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>
  );

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>إعدادات الشركة</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>تعديل بيانات الشركة وطرق التواصل</p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ backgroundColor: saving ? 'rgba(27,75,138,0.5)' : '#1B4B8A', color: 'white', padding: '12px 32px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          {saving ? 'جاري الحفظ...' : saved ? '✅ تم الحفظ' : '💾 حفظ'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Company Info */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>🏢 بيانات الشركة</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>اسم الشركة (عربي)</label>
              <input value={settings.company_name_ar || ''} onChange={e => setSettings({ ...settings, company_name_ar: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Company Name (English)</label>
              <input value={settings.company_name_en || ''} onChange={e => setSettings({ ...settings, company_name_en: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>العنوان (عربي)</label>
              <input value={settings.address_ar || ''} onChange={e => setSettings({ ...settings, address_ar: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Address (English)</label>
              <input value={settings.address_en || ''} onChange={e => setSettings({ ...settings, address_en: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>📞 معلومات التواصل</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>رقم الهاتف</label>
              <input value={settings.phone || ''} onChange={e => setSettings({ ...settings, phone: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>واتساب (بدون +)</label>
              <input value={settings.whatsapp || ''} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} style={inputStyle} placeholder="201000000000" />
            </div>
            <div>
              <label style={labelStyle}>البريد الإلكتروني</label>
              <input value={settings.email || ''} onChange={e => setSettings({ ...settings, email: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Social */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>📱 التواصل الاجتماعي</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Facebook URL</label>
              <input value={settings.facebook || ''} onChange={e => setSettings({ ...settings, facebook: e.target.value })} style={inputStyle} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label style={labelStyle}>Instagram URL</label>
              <input value={settings.instagram || ''} onChange={e => setSettings({ ...settings, instagram: e.target.value })} style={inputStyle} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label style={labelStyle}>YouTube URL</label>
              <input value={settings.youtube || ''} onChange={e => setSettings({ ...settings, youtube: e.target.value })} style={inputStyle} placeholder="https://youtube.com/..." />
            </div>
          </div>
        </div>

        {/* Hero AR */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>🎨 الهيرو - عربي</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>العنوان الأول</label>
              <input value={settings.hero_title_ar || ''} onChange={e => setSettings({ ...settings, hero_title_ar: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>العنوان الثاني</label>
              <input value={settings.hero_title2_ar || ''} onChange={e => setSettings({ ...settings, hero_title2_ar: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>الوصف</label>
              <textarea value={settings.hero_desc_ar || ''} onChange={e => setSettings({ ...settings, hero_desc_ar: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* Hero EN */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>🎨 Hero - English</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Title 1</label>
              <input value={settings.hero_title_en || ''} onChange={e => setSettings({ ...settings, hero_title_en: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Title 2</label>
              <input value={settings.hero_title2_en || ''} onChange={e => setSettings({ ...settings, hero_title2_en: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea value={settings.hero_desc_en || ''} onChange={e => setSettings({ ...settings, hero_desc_en: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>🖼️ صورة الهيرو</h2>
          <ImageUploader settingKey="hero_img" label="صورة الخلفية" />
        </div>

        {/* Logo */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', color: '#4A90D9' }}>🏷️ اللوجو</h2>
          <ImageUploader settingKey="logo_img" label="صورة اللوجو" />
        </div>

      </div>
    </div>
  );
}