'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

type Message = { role: 'user' | 'assistant'; content: string; };
type LeadData = { name: string; phone: string; interest: string; collected: boolean; };

export default function ChatBot() {
  const params = useParams();
  const locale = params?.locale as string || 'ar';
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [leadData, setLeadData] = useState<LeadData>({ name: '', phone: '', interest: '', collected: false });
  const [collectStep, setCollectStep] = useState<'idle' | 'name' | 'phone' | 'done'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: projectsData } = await supabaseAdmin.from('projects').select('*').eq('active', true);
      if (projectsData) setProjects(projectsData);
      const { data: settingsData } = await supabaseAdmin.from('settings').select('*');
      if (settingsData) {
        const obj: Record<string, string> = {};
        settingsData.forEach((row: any) => { obj[row.key] = row.value; });
        setSettings(obj);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'أهلاً وسهلاً! 😊\nأنا كريم، مستشارك في Arcom Developments.\n\nبتدور على وحدة تجارية للاستثمار؟ عندنا مولات تجارية في مواقع مميزة. إيه نوع الوحدة اللي بتدور عليها؟'
      }]);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getProjectQuickReplies = () => {
    return projects.slice(0, 3).map(p => p.name_ar);
  };

  const extractPhone = (text: string) => {
    const cleaned = text.replace(/\s|-/g, '');
    const phoneRegex = /(\+?2?01[0-9]{8,9}|01[0-9]{8,9})/;
    return cleaned.match(phoneRegex)?.[0] || null;
  };

  const saveLead = async (name: string, phone: string, interest: string) => {
    const matchedProject = projects.find(p =>
      interest.includes(p.name_ar) || interest.includes(p.name_en) ||
      messages.some(m => m.content.includes(p.name_ar))
    );

    const { data: newLead } = await supabaseAdmin.from('leads').insert({
      name,
      phone,
      source: 'chatbot',
      status: 'new',
      assigned_to: null,
      project_interest: matchedProject?.name_ar || interest,
      project_id: matchedProject?.id || null,
      notes: `🔥 ليد مستعجل من الشات بوت 🔥\n\nتفاصيل المحادثة:\n${messages.map(m => `${m.role === 'user' ? '👤 العميل' : '🤖 كريم'}: ${m.content}`).join('\n\n')}`,
    }).select().single();

    if (newLead) {
      await supabaseAdmin.from('lead_activities').insert({
        lead_id: newLead.id,
        type: 'comment',
        description: '🔥 ليد من الشات بوت - تم جمع البيانات تلقائياً',
      });

      try {
        const { data: admins } = await supabaseAdmin.from('crm_users').select('id').eq('role', 'superadmin').eq('active', true);
        for (const admin of admins || []) {
          await supabaseAdmin.from('notifications').insert({
            user_id: admin.id, type: 'new_lead', lead_id: newLead.id,
            title: 'ليد جديد من الشات بوت 🔥',
            message: `${name} - ${phone}${matchedProject ? ' - مهتم بـ ' + matchedProject.name_ar : ''}`,
          });
        }
      } catch {}
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      if (collectStep === 'name') {
        setLeadData(prev => ({ ...prev, name: userMessage }));
        setCollectStep('phone');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `تمام! 😊 وايه رقم موبايلك عشان يتواصل معاك مستشارنا المتخصص؟`
        }]);
        setLoading(false);
        return;
      }

      if (collectStep === 'phone') {
        const phone = extractPhone(userMessage);
        if (phone) {
          try {
            await saveLead(leadData.name, phone, leadData.interest);
          } catch (err) {
            console.error('saveLead error:', err);
          }
          setLeadData(prev => ({ ...prev, phone, collected: true }));
          setCollectStep('done');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `تمام يا ${leadData.name}! ✅\nبياناتك وصلت لفريقنا، وهيتواصل معاك مستشارنا في أقرب وقت.\n\nفي أي استفسار تاني أنا هنا! 😊`
          }]);
          setLoading(false);
          return;
        } else {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'من فضلك اكتب الرقم صح زي كده: 01001234567'
          }]);
          setLoading(false);
          return;
        }
      }

      const allMessages = [...messages, { role: 'user' as const, content: userMessage }];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: allMessages.slice(-14),
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'معلش، حصل خطأ. حاول تاني.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      const interestKeywords = ['حجز', 'احجز', 'معاينة', 'اشتري', 'book', 'reserve', 'visit'];
      const showedInterest = interestKeywords.some(kw => userMessage.toLowerCase().includes(kw));
      const messageCount = messages.length;
      const aiAskedForName = reply.includes('اسمك') || reply.includes('your name');

      if (aiAskedForName && collectStep === 'idle' && !leadData.collected) {
        const interest = projects.find(p =>
          userMessage.includes(p.name_ar) || userMessage.includes(p.name_en) ||
          messages.some(m => m.content.includes(p.name_ar))
        )?.name_ar || userMessage;
        setLeadData(prev => ({ ...prev, interest }));
        setCollectStep('name');
      } else if (showedInterest && collectStep === 'idle' && !leadData.collected && messageCount >= 4 && !aiAskedForName) {
        const interest = projects.find(p =>
          userMessage.includes(p.name_ar) || userMessage.includes(p.name_en) ||
          messages.some(m => m.content.includes(p.name_ar))
        )?.name_ar || userMessage;

        setLeadData(prev => ({ ...prev, interest }));
        setCollectStep('name');

        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'كويس جداً! 😊 عشان أقدر أساعدك أكتر وأحولك لمستشارنا المتخصص اللي هيديك كل التفاصيل...\nممكن أعرف اسمك الكريم؟'
          }]);
        }, 1200);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'معلش، حصل خطأ. حاول تاني.' }]);
    }

    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(27,75,138,0.7); }
          70% { box-shadow: 0 0 0 12px rgba(27,75,138,0); }
          100% { box-shadow: 0 0 0 0 rgba(27,75,138,0); }
        }
        .chat-messages::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Chat Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{ position: 'fixed', bottom: '32px', left: '100px', width: '58px', height: '58px', backgroundColor: '#1B4B8A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: 'none', cursor: 'pointer', zIndex: 50, transition: 'transform 0.3s', animation: !open ? 'pulse 2.5s infinite' : 'none' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div style={{ position: 'fixed', bottom: '100px', left: '32px', width: '370px', height: '550px', backgroundColor: '#0A0F1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', flexDirection: 'column', zIndex: 50, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden', fontFamily: 'Cairo, sans-serif' }}>

          {/* Header */}
          <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #1B4B8A 0%, #4A90D9 100%)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)' }}>🤖</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '15px', margin: 0 }}>كريم</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#25D366' }} />
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '11px', margin: 0 }}>مستشار عقاري • متاح الآن</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Messages */}
          <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(27,75,138,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
                )}
                <div style={{ maxWidth: '78%' }}>
                  <div style={{ padding: '11px 15px', borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', backgroundColor: msg.role === 'user' ? '#1B4B8A' : 'rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', lineHeight: 1.75, whiteSpace: 'pre-wrap', direction: 'rtl' }}>
                    {msg.content}
                  </div>
                  {/* Project buttons after assistant messages that mention projects */}
                  {msg.role === 'assistant' && i === messages.length - 1 && !loading && collectStep === 'idle' && (() => {
                    const mentioned = projects.filter(p => msg.content.includes(p.name_ar) || msg.content.includes(p.name_en));
                    if (mentioned.length === 0) return null;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {mentioned.map(p => (
                          <button key={p.id} onClick={() => { setInput(`عايز أعرف تفاصيل ${p.name_ar}`); setTimeout(() => sendMessage(), 100); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', backgroundColor: 'rgba(27,75,138,0.15)', border: '1px solid rgba(74,144,217,0.3)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px', textAlign: 'right', direction: 'rtl', transition: 'all 0.2s', width: '100%' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(27,75,138,0.3)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(27,75,138,0.15)'; e.currentTarget.style.borderColor = 'rgba(74,144,217,0.3)'; }}
                          >
                            <span style={{ fontSize: '16px' }}>🏢</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontWeight: 700, display: 'block' }}>{p.name_ar}</span>
                              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>📍 {p.location_ar}</span>
                            </div>
                            <span style={{ color: '#4A90D9', fontSize: '14px' }}>←</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(27,75,138,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
                <div style={{ padding: '11px 15px', borderRadius: '4px 18px 18px 18px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontSize: '13px', direction: 'rtl' }}>
                  كريم بيكتب...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && collectStep === 'idle' && !loading && (
            <div style={{ padding: '0 16px 10px', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {(messages.length === 1
                ? ['محل تجاري', 'مكتب إداري', 'كافيه أو مطعم', 'عايز أعرف المشاريع']
                : [...getProjectQuickReplies(), 'الوحدات المتاحة']
              ).map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(() => sendMessage(), 100); }} style={{ backgroundColor: 'rgba(27,75,138,0.2)', border: '1px solid rgba(74,144,217,0.35)', borderRadius: '50px', padding: '6px 13px', color: '#4A90D9', fontSize: '12px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(27,75,138,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(27,75,138,0.2)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder='اكتب رسالتك...'
              style={{ flex: 1, padding: '10px 16px', borderRadius: '50px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif', outline: 'none', direction: 'rtl' }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: input.trim() ? '#1B4B8A' : 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: input.trim() ? 'pointer' : 'default', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}