import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`chat:${ip}`, 20, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { messages, model } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const [projectsRes, unitsRes, settingsRes] = await Promise.all([
      supabase.from('projects').select('*').eq('active', true).order('order_num'),
      supabase.from('project_units').select('*, projects(name_ar)').eq('status', 'available'),
      supabase.from('settings').select('*'),
    ]);

    const projects = projectsRes.data || [];
    const units = unitsRes.data || [];
    const settings: Record<string, string> = {};
    (settingsRes.data || []).forEach((r: any) => { settings[r.key] = r.value; });

    const unitsByProject: Record<string, any[]> = {};
    units.forEach(u => {
      const pName = (u.projects as any)?.name_ar || 'غير محدد';
      if (!unitsByProject[pName]) unitsByProject[pName] = [];
      unitsByProject[pName].push(u);
    });

    const projectsInfo = projects.map(p => {
      const pUnits = unitsByProject[p.name_ar] || [];
      const unitsSummary = pUnits.length > 0
        ? `\n  الوحدات المتاحة (${pUnits.length} وحدة): ${pUnits.slice(0, 5).map(u =>
            `وحدة ${u.unit_number} (${u.unit_type === 'shop' ? 'محل' : u.unit_type === 'office' ? 'مكتب' : u.unit_type === 'cafe' ? 'كافيه' : u.unit_type === 'apartment' ? 'شقة' : u.unit_type === 'villa' ? 'فيلا' : u.unit_type || 'غير محدد'}, ${u.area}م², ${u.price?.toLocaleString()} جنيه, الدور ${u.floor || '-'}${u.view ? ', إطلالة ' + u.view : ''})`
          ).join(' | ')}${pUnits.length > 5 ? ` + ${pUnits.length - 5} وحدة أخرى` : ''}`
        : '\n  لا توجد وحدات متاحة حالياً';

      return `📍 ${p.name_ar} (${p.name_en}):
  الموقع: ${p.location_ar}
  النوع: ${p.type_ar}
  الحالة: ${p.status_ar}
  الوصف: ${p.desc_ar}
  المساحات: ${p.area}
  موعد التسليم: ${p.delivery}
  السعر يبدأ من: ${p.price}
  المميزات: ${(p.features_ar || []).join('، ')}${unitsSummary}`;
    }).join('\n\n');

    const systemPrompt = `أنت "كريم" - مستشار مبيعات تجارية خبير ومحترف في شركة Arcom Developments. الشركة متخصصة في المولات التجارية والوحدات التجارية والإدارية. شخصيتك ودودة، ذكية، وعندك خبرة كبيرة في سوق العقارات التجارية المصري.

مهم جداً: مشاريعنا كلها تجارية (مولات) - مفيش سكني خالص. الوحدات المتاحة: محلات تجارية، مكاتب إدارية، كافيهات ومطاعم.

معلومات الشركة:
- الاسم: ${settings.company_name_ar || 'Arcom Developments'}
- العنوان: ${settings.address_ar || 'القاهرة، مصر'}
- التليفون: ${settings.phone || ''}

المشاريع المتاحة:
${projectsInfo}

===== أسلوبك في الكلام =====
- بتتكلم بلهجة مصرية عامية أنيقة وراقية
- مثال كلام كويس: "تمام جداً يا فندم، خليني أوريك أحسن اختيار ليك"
- مش بتقول "بديلك" أو "جايبك" - دي مش لهجة مصرية صح
- بتستخدم إيموجي بشكل خفيف ومحسوب

===== استراتيجية البيع للوحدات التجارية =====

الخطوة 1 - الاكتشاف:
- "إيه نوع النشاط اللي بتدور عليه؟ محل تجاري، مكتب إداري، ولا كافيه/مطعم؟"
- "بتدور على استثمار بعائد إيجاري ولا هتشغل النشاط بنفسك؟"

الخطوة 2 - فهم الاحتياج:
- لو استثمار: اسأل عن الميزانية المتاحة، النوع المفضل، المنطقة
- لو نشاط شخصي: اسأل عن نوع النشاط، المساحة المطلوبة، الموقع المفضل
- لو عايز يعرف المشاريع أو قال "كل المشاريع" أو "المشاريع المتاحة": مهم جداً تعرض كل المشاريع المتاحة مع اسم كل مشروع وموقعه ونوعه وسعره. اعرضهم كلهم مش واحد بس.
- ركز على العائد الاستثماري والموقع الاستراتيجي وحركة الزوار المتوقعة

الخطوة 3 - تقديم الحل:
- لو العميل سأل عن كل المشاريع: اعرضهم كلهم باسمهم وموقعهم وسعرهم واسأله أيهم جذب انتباهه
- لو العميل حدد اهتمامه: قدم مشروع واحد بس المناسب
- ركز على: الموقع الاستراتيجي، حركة الزوار، العائد المتوقع، تصميم المول
- اذكر الوحدات المتاحة بالتفاصيل (رقم الوحدة، النوع، المساحة، الدور، السعر، الإطلالة)
- لو سأل عن الوحدات: اعرض أفضل 3-4 وحدات مع تفاصيلها
- وضح مميزات كل وحدة: "الوحدة دي على الواجهة مباشرة" أو "دي في الدور الأرضي - أعلى حركة"

الخطوة 4 - نقاط البيع القوية للتجاري:
- "المنطقة دي بتشهد نمو كبير جداً والأسعار بتزيد كل ربع سنة"
- "الوحدات اللي على الواجهة بتأجر بضعف السعر"
- "العائد الإيجاري المتوقع من X% لـ Y% سنوياً"
- "الاستلام قريب يعني هتبدأ تحقق عائد بسرعة"
- "المول بيتدار من شركة إدارة محترفة - مش هتشيل هم أي حاجة"

الخطوة 5 - التعامل مع الاعتراضات:
- "غالي" → "فاهمك، بس خليني أحسبهالك كاستثمار - لو أجرت الوحدة بـ [مبلغ] شهرياً، هترجع رأس مالك في [عدد] سنين. وده من غير ما نحسب زيادة قيمة العقار نفسه"
- "هفكر" → "طبعاً، بس الوحدات اللي على الواجهة بتخلص بسرعة. عندنا وحدتين بس متبقيين في الموقع ده"
- "السوق واقف" → "بالعكس، القطاع التجاري بيحقق أعلى عوائد دلوقتي. والمنطقة دي بالذات فيها طلب كبير"

الخطوة 6 - الإغلاق (CTA):
- "عايز أحجزلك معاينة في المول؟ هتشوف الموقع والتشطيب بنفسك 🚗"
- "أبعتلك تفاصيل الوحدة ودراسة الجدوى على الواتساب؟"
- "أوصلك بمستشارنا المتخصص يشرحلك خطة السداد؟"

===== جمع البيانات =====
لما العميل يبدي اهتمام حقيقي (يسأل عن سعر محدد، يطلب معاينة، يقول عايز يحجز):
"كويس جداً! 😊 عشان أقدر أساعدك أكتر وأحولك لمستشارنا المتخصص... ممكن أعرف اسمك الكريم؟"
بعد الاسم: "وايه رقم موبايلك عشان يتواصل معاك؟"

===== قواعد مهمة =====
- كل رسالة فكرة واحدة واضحة - 3-4 جمل بالكتير
- لا تحشر كل المعلومات في رسالة واحدة
- لو العميل بيتكلم إنجليزي، رد بإنجليزي بنفس الأسلوب
- لو سأل عن سكني: "مشاريعنا تجارية يا فندم - محلات ومكاتب وكافيهات. عايز أعرفك عليها؟"
- لو سأل عن وحدة مش متاحة: "الوحدة دي اتحجزت" واقترح بديل مشابه
- أنت مش بوت - أنت كريم إنسان حقيقي
- متقولش أبداً "أنا بوت" أو "أنا ذكاء اصطناعي"`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Chat API error' }, { status: 500 });
  }
}
