'use client';
import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useCrmLocale } from '@/lib/crm/useCrmLocale';
import { t } from '@/lib/crm/translations';

type Article = {
  id: string; title: string; content: string; category: string;
  created_by: string; created_at: string; updated_at: string;
  crm_users?: { name: string };
};

const getCategories = (locale: 'ar' | 'en') => [
  { key: 'sales_scripts', label: locale === 'ar' ? '📞 سكريبتات البيع' : '📞 Sales Scripts', color: '#4A90D9' },
  { key: 'project_info', label: locale === 'ar' ? '🏢 معلومات المشاريع' : '🏢 Project Info', color: '#25D366' },
  { key: 'objections', label: locale === 'ar' ? '🛡️ الرد على الاعتراضات' : '🛡️ Objection Handling', color: '#E67E22' },
  { key: 'pricing', label: locale === 'ar' ? '💰 الأسعار والعروض' : '💰 Pricing & Offers', color: '#C9A84C' },
  { key: 'procedures', label: locale === 'ar' ? '📋 إجراءات وسياسات' : '📋 Procedures & Policies', color: '#9B59B6' },
  { key: 'general', label: locale === 'ar' ? '📝 عام' : '📝 General', color: '#888' },
];

export default function KnowledgePage() {
  const { locale, dir } = useCrmLocale();
  const categories = getCategories(locale);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });

  useEffect(() => {
    const stored = localStorage.getItem('crm_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const load = async () => {
    const { data } = await supabaseAdmin
      .from('knowledge_base')
      .select('*, crm_users(name)')
      .order('updated_at', { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);

    if (editingId) {
      await supabaseAdmin.from('knowledge_base').update({
        title: form.title, content: form.content, category: form.category,
        updated_at: new Date().toISOString(),
      }).eq('id', editingId);
    } else {
      await supabaseAdmin.from('knowledge_base').insert({
        title: form.title, content: form.content, category: form.category,
        created_by: user?.id,
      });
    }

    setSaving(false);
    setShowAdd(false);
    setEditingId(null);
    setForm({ title: '', content: '', category: 'general' });
    load();
  };

  const handleDelete = async (id: string) => {
    await supabaseAdmin.from('knowledge_base').delete().eq('id', id);
    setSelectedArticle(null);
    load();
  };

  const handleEdit = (article: Article) => {
    setForm({ title: article.title, content: article.content, category: article.category });
    setEditingId(article.id);
    setSelectedArticle(null);
    setShowAdd(true);
  };

  const filtered = articles.filter(a => {
    const matchCategory = filterCategory === 'all' || a.category === filterCategory;
    const matchSearch = !search || a.title.includes(search) || a.content.includes(search);
    return matchCategory && matchSearch;
  });

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
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>{t('knowledge', locale)}</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>{locale === 'ar' ? 'سكريبتات، معلومات المشاريع، والأسئلة الشائعة' : 'Scripts, project info, and FAQs'}</p>
        </div>
        {user?.role !== 'sales' && (
          <button onClick={() => { setEditingId(null); setForm({ title: '', content: '', category: 'general' }); setShowAdd(true); }} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 28px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
            {locale === 'ar' ? '+ إضافة مقال' : '+ Add Article'}
          </button>
        )}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterCategory('all')} style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: filterCategory === 'all' ? '#1B4B8A' : 'rgba(255,255,255,0.05)', border: filterCategory === 'all' ? '1px solid #4A90D9' : '1px solid rgba(255,255,255,0.1)', color: filterCategory === 'all' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
          {locale === 'ar' ? 'الكل' : 'All'} ({articles.length})
        </button>
        {categories.map(c => {
          const count = articles.filter(a => a.category === c.key).length;
          return (
            <button key={c.key} onClick={() => setFilterCategory(c.key)} style={{ padding: '8px 16px', borderRadius: '50px', backgroundColor: filterCategory === c.key ? `${c.color}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${filterCategory === c.key ? `${c.color}50` : 'rgba(255,255,255,0.1)'}`, color: filterCategory === c.key ? c.color : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder={locale === 'ar' ? '🔍 بحث في المقالات...' : '🔍 Search articles...'} style={{ ...inputStyle, marginBottom: '20px', width: '300px' }} />

      {/* Articles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filtered.map(article => {
          const cat = categories.find(c => c.key === article.category);
          return (
            <div key={article.id} onClick={() => setSelectedArticle(article)} style={{ padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'white' }}>{article.title}</h3>
                <span style={{ backgroundColor: `${cat?.color || '#888'}15`, border: `1px solid ${cat?.color || '#888'}30`, borderRadius: '50px', padding: '2px 8px', fontSize: '10px', color: cat?.color || '#888', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {cat?.label || 'عام'}
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                {article.content}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                <span>{(article.crm_users as any)?.name}</span>
                <span>{article.updated_at?.slice(0, 10)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '40px', gridColumn: '1/-1' }}>{locale === 'ar' ? 'لا يوجد مقالات' : 'No articles'}</p>
        )}
      </div>

      {/* View Article Modal */}
      {selectedArticle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>{selectedArticle.title}</h2>
              <button onClick={() => setSelectedArticle(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 2, margin: '0 0 24px', whiteSpace: 'pre-wrap' }}>{selectedArticle.content}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                {(selectedArticle.crm_users as any)?.name} · {selectedArticle.updated_at?.slice(0, 10)}
              </span>
              {user?.role !== 'sales' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(selectedArticle)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>{t('edit', locale)}</button>
                  <button onClick={() => handleDelete(selectedArticle.id)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px' }}>{locale === 'ar' ? '🗑️ حذف' : '🗑️ Delete'}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>{editingId ? (locale === 'ar' ? 'تعديل مقال' : 'Edit Article') : (locale === 'ar' ? 'إضافة مقال جديد' : 'Add New Article')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'العنوان *' : 'Title *'}</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'التصنيف' : 'Category'}</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {categories.map(c => <option key={c.key} value={c.key} style={{ backgroundColor: '#0A0F1A' }}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', display: 'block', marginBottom: '5px' }}>{locale === 'ar' ? 'المحتوى *' : 'Content *'}</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={10} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>{t('cancel', locale)}</button>
              <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()} style={{ flex: 2, padding: '12px', borderRadius: '10px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                {saving ? t('saving', locale) : t('save', locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
