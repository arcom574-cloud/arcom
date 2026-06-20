'use client';
import { useEffect, useState, useRef } from 'react';
import { supabaseAdmin } from '@/lib/supabase';

type Project = {
  id?: string;
  slug: string;
  name_ar: string;
  name_en: string;
  location_ar: string;
  location_en: string;
  type_ar: string;
  type_en: string;
  status_ar: string;
  status_en: string;
  desc_ar: string;
  desc_en: string;
  img: string;
  imgs: string[];
  units: number;
  area: string;
  delivery: string;
  floors: number;
  price: string;
  features_ar: string[];
  features_en: string[];
  order_num: number;
  active: boolean;
  brochure_url: string;
  brochure_url_en: string;
  lat: number;
  lng: number;
};

const emptyProject: Project = {
  slug: '', name_ar: '', name_en: '', location_ar: '', location_en: '',
  type_ar: 'تجاري', type_en: 'Commercial', status_ar: 'متاح', status_en: 'Available',
  desc_ar: '', desc_en: '', img: '', imgs: [], units: 0, area: '', delivery: '',
  floors: 0, price: '', features_ar: [], features_en: [], order_num: 0, active: true,
  brochure_url: '', brochure_url_en: '', lat: 0, lng: 0,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [uploadingBrochure, setUploadingBrochure] = useState<string | null>(null);
  const [deleting, setDeleting] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const brochureArRef = useRef<HTMLInputElement>(null);
  const brochureEnRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data, error } = await supabaseAdmin.from('projects').select('*').order('order_num');
    console.log('load:', data, error);
    if (data) setProjects(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `projects/${Date.now()}.${ext}`;
    const { error } = await supabaseAdmin.storage.from('images').upload(path, file, { upsert: true });
    console.log('upload error:', error);
    const { data } = supabaseAdmin.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMainImage = async (file: File) => {
    setUploading(true);
    const url = await uploadImage(file);
    setEditing(prev => prev ? { ...prev, img: url, imgs: [url, ...prev.imgs.filter(i => i !== prev.img)] } : null);
    setUploading(false);
  };

  const handleAlbumImages = async (files: FileList) => {
    setUploadingAlbum(true);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(files[i]);
      urls.push(url);
    }
    setEditing(prev => prev ? { ...prev, imgs: [...prev.imgs, ...urls] } : null);
    setUploadingAlbum(false);
  };

  const removeAlbumImage = (url: string) => {
    setEditing(prev => prev ? { ...prev, imgs: prev.imgs.filter(i => i !== url) } : null);
  };

  const handleBrochureUpload = async (file: File, field: 'brochure_url' | 'brochure_url_en') => {
    setUploadingBrochure(field);
    const ext = file.name.split('.').pop();
    const path = `brochures/${field}-${Date.now()}.${ext}`;
    const { error } = await supabaseAdmin.storage.from('images').upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabaseAdmin.storage.from('images').getPublicUrl(path);
      setEditing(prev => prev ? { ...prev, [field]: data.publicUrl } : null);
    }
    setUploadingBrochure(null);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    if (!editing.slug && editing.name_en) {
      editing.slug = editing.name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    if (editing.id) {
      const { error } = await supabaseAdmin.from('projects').update({ ...editing, updated_at: new Date().toISOString() }).eq('id', editing.id);
      console.log('update error:', error);
    } else {
      const { error } = await supabaseAdmin.from('projects').insert({ ...editing });
      console.log('insert error:', error);
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
    setDeleting(id);
    const { error } = await supabaseAdmin.from('projects').delete().eq('id', id);
    console.log('delete error:', error);
    setDeleting('');
    load();
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px',
    fontFamily: 'Cairo, sans-serif', outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    color: 'rgba(255,255,255,0.45)', fontSize: '11px',
    letterSpacing: '1px', display: 'block', marginBottom: '5px',
  };

  if (loading) return <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif' }}>جاري التحميل...</div>;

  if (editing) return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
          {editing.id ? 'تعديل المشروع' : 'إضافة مشروع جديد'}
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setEditing(null)} style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>🖼️ الصورة الرئيسية</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {editing.img && <img src={editing.img} alt="" style={{ width: '200px', height: '130px', objectFit: 'cover', borderRadius: '12px' }} />}
            <div style={{ flex: 1 }}>
              <input value={editing.img} onChange={e => setEditing({ ...editing, img: e.target.value })} style={inputStyle} placeholder="رابط الصورة أو ارفع من جهازك" />
              <button onClick={() => imgRef.current?.click()} style={{ marginTop: '10px', padding: '10px 20px', borderRadius: '10px', backgroundColor: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                {uploading ? 'جاري الرفع...' : '📁 رفع صورة'}
              </button>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleMainImage(e.target.files[0])} />
            </div>
          </div>
        </div>

        {/* Album */}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#25D366' }}>📸 ألبوم صور المشروع</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {(editing.imgs || []).map((url, i) => (
              <div key={i} style={{ position: 'relative', width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => removeAlbumImage(url)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(255,68,68,0.8)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ))}
            {(editing.imgs || []).length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>لا يوجد صور في الألبوم</p>}
          </div>
          <button onClick={() => albumRef.current?.click()} style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {uploadingAlbum ? 'جاري الرفع...' : '📁 إضافة صور'}
          </button>
          <input ref={albumRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && handleAlbumImages(e.target.files)} />
        </div>

        {/* Brochure */}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#E67E22' }}>📄 بروشور المشروع (PDF)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Arabic Brochure */}
            <div>
              <label style={labelStyle}>البروشور العربي</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={editing.brochure_url || ''} onChange={e => setEditing({ ...editing, brochure_url: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="رابط أو ارفع PDF" />
                <button onClick={() => brochureArRef.current?.click()} style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(230,126,34,0.15)', border: '1px solid rgba(230,126,34,0.3)', color: '#E67E22', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px', whiteSpace: 'nowrap' }}>
                  {uploadingBrochure === 'brochure_url' ? '...' : '📁 رفع'}
                </button>
                <input ref={brochureArRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleBrochureUpload(e.target.files[0], 'brochure_url')} />
              </div>
              {editing.brochure_url && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#25D366' }}>✅</span>
                  <a href={editing.brochure_url} target="_blank" style={{ fontSize: '11px', color: '#4A90D9', textDecoration: 'none' }}>عرض</a>
                </div>
              )}
            </div>
            {/* English Brochure */}
            <div>
              <label style={labelStyle}>English Brochure</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={editing.brochure_url_en || ''} onChange={e => setEditing({ ...editing, brochure_url_en: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="Link or upload PDF" />
                <button onClick={() => brochureEnRef.current?.click()} style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: 'rgba(230,126,34,0.15)', border: '1px solid rgba(230,126,34,0.3)', color: '#E67E22', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '11px', whiteSpace: 'nowrap' }}>
                  {uploadingBrochure === 'brochure_url_en' ? '...' : '📁 Upload'}
                </button>
                <input ref={brochureEnRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleBrochureUpload(e.target.files[0], 'brochure_url_en')} />
              </div>
              {editing.brochure_url_en && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#25D366' }}>✅</span>
                  <a href={editing.brochure_url_en} target="_blank" style={{ fontSize: '11px', color: '#4A90D9', textDecoration: 'none' }}>View</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#9B59B6' }}>📍 إحداثيات الموقع على الخريطة</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '12px' }}>
            افتح Google Maps → اضغط كليك يمين على موقع المشروع → Copy coordinates → الصقها هنا
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Latitude (خط العرض)</label>
              <input type="number" step="any" value={editing.lat || ''} onChange={e => setEditing({ ...editing, lat: +e.target.value })} style={inputStyle} placeholder="30.0444" />
            </div>
            <div>
              <label style={labelStyle}>Longitude (خط الطول)</label>
              <input type="number" step="any" value={editing.lng || ''} onChange={e => setEditing({ ...editing, lng: +e.target.value })} style={inputStyle} placeholder="31.2357" />
            </div>
          </div>
          {editing.lat && editing.lng ? (
            <a href={`https://www.google.com/maps?q=${editing.lat},${editing.lng}`} target="_blank" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: '#4A90D9', textDecoration: 'none' }}>
              🗺️ عرض على Google Maps
            </a>
          ) : null}
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>📋 البيانات الأساسية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>اسم المشروع (عربي) *</label>
              <input value={editing.name_ar} onChange={e => setEditing({ ...editing, name_ar: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Project Name (English) *</label>
              <input value={editing.name_en} onChange={e => setEditing({ ...editing, name_en: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الموقع (عربي)</label>
              <input value={editing.location_ar} onChange={e => setEditing({ ...editing, location_ar: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Location (English)</label>
              <input value={editing.location_en} onChange={e => setEditing({ ...editing, location_en: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>النوع (عربي)</label>
              <select value={editing.type_ar} onChange={e => setEditing({ ...editing, type_ar: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['سكني', 'تجاري', 'سكني فاخر', 'إداري'].map(t => <option key={t} value={t} style={{ backgroundColor: '#050A14' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type (English)</label>
              <select value={editing.type_en} onChange={e => setEditing({ ...editing, type_en: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['Residential', 'Commercial', 'Luxury', 'Administrative'].map(t => <option key={t} value={t} style={{ backgroundColor: '#050A14' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>الحالة (عربي)</label>
              <select value={editing.status_ar} onChange={e => setEditing({ ...editing, status_ar: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['متاح', 'تحت الإنشاء', 'قريباً', 'مكتمل'].map(t => <option key={t} value={t} style={{ backgroundColor: '#050A14' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status (English)</label>
              <select value={editing.status_en} onChange={e => setEditing({ ...editing, status_en: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['Available', 'Under Construction', 'Coming Soon', 'Completed'].map(t => <option key={t} value={t} style={{ backgroundColor: '#050A14' }}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>الوصف (عربي)</label>
              <textarea value={editing.desc_ar} onChange={e => setEditing({ ...editing, desc_ar: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description (English)</label>
              <textarea value={editing.desc_en} onChange={e => setEditing({ ...editing, desc_en: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>📊 الأرقام</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            <div><label style={labelStyle}>عدد الوحدات</label><input type="number" value={editing.units} onChange={e => setEditing({ ...editing, units: +e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>المساحات م²</label><input value={editing.area} onChange={e => setEditing({ ...editing, area: e.target.value })} style={inputStyle} placeholder="150-300" /></div>
            <div><label style={labelStyle}>التسليم</label><input value={editing.delivery} onChange={e => setEditing({ ...editing, delivery: e.target.value })} style={inputStyle} placeholder="2026" /></div>
            <div><label style={labelStyle}>الأدوار</label><input type="number" value={editing.floors} onChange={e => setEditing({ ...editing, floors: +e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>السعر</label><input value={editing.price} onChange={e => setEditing({ ...editing, price: e.target.value })} style={inputStyle} /></div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>✨ المميزات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>المميزات (عربي) - كل سطر ميزة</label>
              <textarea value={editing.features_ar.join('\n')} onChange={e => setEditing({ ...editing, features_ar: e.target.value.split('\n').filter(f => f.trim()) })} rows={6} style={{ ...inputStyle, resize: 'none' }} placeholder="حمام سباحة&#10;نادي رياضي" />
            </div>
            <div>
              <label style={labelStyle}>Features (English) - one per line</label>
              <textarea value={editing.features_en.join('\n')} onChange={e => setEditing({ ...editing, features_en: e.target.value.split('\n').filter(f => f.trim()) })} rows={6} style={{ ...inputStyle, resize: 'none' }} placeholder="Swimming Pool&#10;Gym" />
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>⚙️ إعدادات</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div><label style={labelStyle}>الـ Slug (URL)</label><input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} style={inputStyle} /></div>
            <div><label style={labelStyle}>الترتيب</label><input type="number" value={editing.order_num} onChange={e => setEditing({ ...editing, order_num: +e.target.value })} style={inputStyle} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} id="active" />
              <label htmlFor="active" style={{ color: 'white', cursor: 'pointer' }}>مشروع نشط</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>إدارة المشاريع</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{projects.length} مشروع</p>
        </div>
        <button onClick={() => setEditing({ ...emptyProject })} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          + إضافة مشروع
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {projects.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {p.img && <img src={p.img} alt="" style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: 0 }}>{p.name_ar}</h3>
                <span style={{ backgroundColor: p.active ? 'rgba(37,211,102,0.1)' : 'rgba(255,68,68,0.1)', border: `1px solid ${p.active ? 'rgba(37,211,102,0.3)' : 'rgba(255,68,68,0.3)'}`, borderRadius: '50px', padding: '2px 10px', fontSize: '11px', color: p.active ? '#25D366' : '#ff4444' }}>
                  {p.active ? 'نشط' : 'مخفي'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>📍 {p.location_ar} · {p.type_ar} · {p.status_ar}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`/ar/projects/${p.slug}`} target="_blank" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '12px' }}>🌐 عرض</a>
              <button onClick={() => setEditing(p)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>✏️ تعديل</button>
              <button onClick={() => handleDelete(p.id!)} disabled={deleting === p.id} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                {deleting === p.id ? '...' : '🗑️ حذف'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}