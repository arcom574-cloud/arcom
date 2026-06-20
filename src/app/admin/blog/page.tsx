'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Post = {
  id?: string;
  slug: string;
  title_ar: string;
  title_en: string;
  category_ar: string;
  category_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  img: string;
  read_time: number;
  published: boolean;
};

const emptyPost: Post = {
  slug: '', title_ar: '', title_en: '', category_ar: 'استثمار', category_en: 'Investment',
  excerpt_ar: '', excerpt_en: '', content_ar: '', content_en: '',
  img: '', read_time: 5, published: true,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Post | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState('');
  const imgRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File): Promise<string> => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `blog/${Date.now()}.${ext}`;
    await supabase.storage.from('images').upload(path, file, { upsert: true });
    const { data } = supabase.storage.from('images').getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    if (!editing.slug && editing.title_en) {
      editing.slug = editing.title_en.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (editing.id) {
      await supabase.from('blog_posts').update({ ...editing, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('blog_posts').insert({ ...editing });
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;
    setDeleting(id);
    await supabase.from('blog_posts').delete().eq('id', id);
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
          {editing.id ? 'تعديل المقال' : 'إضافة مقال جديد'}
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setEditing(null)} style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Image */}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>🖼️ صورة المقال</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            {editing.img && <img src={editing.img} alt="" style={{ width: '180px', height: '120px', objectFit: 'cover', borderRadius: '12px' }} />}
            <div style={{ flex: 1 }}>
              <input value={editing.img} onChange={e => setEditing({ ...editing, img: e.target.value })} style={inputStyle} placeholder="رابط الصورة أو ارفع من جهازك" />
              <button onClick={() => imgRef.current?.click()} style={{ marginTop: '10px', padding: '10px 20px', borderRadius: '10px', backgroundColor: 'rgba(74,144,217,0.2)', border: '1px solid rgba(74,144,217,0.4)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                {uploading ? 'جاري الرفع...' : '📁 رفع صورة'}
              </button>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={async e => { if (e.target.files?.[0]) { const url = await uploadImage(e.target.files[0]); setEditing(prev => prev ? { ...prev, img: url } : null); } }} />
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#4A90D9' }}>📋 البيانات الأساسية</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>عنوان المقال (عربي) *</label>
              <input value={editing.title_ar} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Article Title (English) *</label>
              <input value={editing.title_en} onChange={e => setEditing({ ...editing, title_en: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>التصنيف (عربي)</label>
              <select value={editing.category_ar} onChange={e => setEditing({ ...editing, category_ar: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['استثمار', 'دليل', 'نصائح', 'تمويل', 'سياحة', 'أخبار'].map(c => (
                  <option key={c} value={c} style={{ backgroundColor: '#050A14' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category (English)</label>
              <select value={editing.category_en} onChange={e => setEditing({ ...editing, category_en: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['Investment', 'Guide', 'Tips', 'Finance', 'Tourism', 'News'].map(c => (
                  <option key={c} value={c} style={{ backgroundColor: '#050A14' }}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>وقت القراءة (دقائق)</label>
              <input type="number" value={editing.read_time} onChange={e => setEditing({ ...editing, read_time: +e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>الـ Slug (URL)</label>
              <input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>مقتطف (عربي)</label>
              <textarea value={editing.excerpt_ar} onChange={e => setEditing({ ...editing, excerpt_ar: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Excerpt (English)</label>
              <textarea value={editing.excerpt_en} onChange={e => setEditing({ ...editing, excerpt_en: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#4A90D9' }}>📄 محتوى المقال</h3>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '16px' }}>استخدم **نص** للعناوين الفرعية</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={labelStyle}>المحتوى (عربي)</label>
              <textarea value={editing.content_ar} onChange={e => setEditing({ ...editing, content_ar: e.target.value })} rows={15} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Content (English)</label>
              <textarea value={editing.content_en} onChange={e => setEditing({ ...editing, content_en: e.target.value })} rows={15} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
        </div>

        {/* Published */}
        <div style={{ padding: '20px 24px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} id="published" style={{ width: '18px', height: '18px' }} />
          <label htmlFor="published" style={{ color: 'white', cursor: 'pointer', fontSize: '14px' }}>منشور (ظاهر في الموقع)</label>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>إدارة المدونة</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{posts.length} مقال</p>
        </div>
        <button onClick={() => setEditing({ ...emptyPost })} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          + إضافة مقال
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {posts.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {p.img && <img src={p.img} alt="" style={{ width: '80px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', margin: 0 }}>{p.title_ar}</h3>
                <span style={{ backgroundColor: p.published ? 'rgba(37,211,102,0.1)' : 'rgba(255,68,68,0.1)', border: `1px solid ${p.published ? 'rgba(37,211,102,0.3)' : 'rgba(255,68,68,0.3)'}`, borderRadius: '50px', padding: '2px 10px', fontSize: '11px', color: p.published ? '#25D366' : '#ff4444' }}>
                  {p.published ? 'منشور' : 'مسودة'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>{p.category_ar} · {p.read_time} دقائق قراءة</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a href={`/ar/blog/${p.slug}`} target="_blank" style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '12px' }}>
                🌐 عرض
              </a>
              <button onClick={() => setEditing(p)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                ✏️ تعديل
              </button>
              <button onClick={() => handleDelete(p.id!)} disabled={deleting === p.id} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff4444', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
                {deleting === p.id ? '...' : '🗑️ حذف'}
              </button>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📝</div>
            <p>لا يوجد مقالات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}