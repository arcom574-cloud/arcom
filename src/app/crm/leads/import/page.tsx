'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

type ParsedLead = {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  isDuplicate: boolean;
  existingName?: string;
  existingId?: string;
};

export default function ImportLeadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedLead[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const extractPhone = (text: string): string | null => {
    const cleaned = text.replace(/[\s\-\(\)]/g, '');
    const match = cleaned.match(/(\+?2?01[0-9]{8,9})/);
    return match ? match[0] : null;
  };

  const parseExcel = async (file: File): Promise<ParsedLead[]> => {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const results: ParsedLead[] = [];

    // Loop through ALL sheets/tabs
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      for (const row of rows) {
        if (!row || row.length === 0) continue;
        const rowText = row.join(' ');
        const phone = extractPhone(rowText);
        if (!phone) continue;

        // Try to find name - usually first non-phone, non-empty text cell
        let name = '';
        for (const cell of row) {
          const cellStr = String(cell || '').trim();
          if (cellStr && !extractPhone(cellStr) && cellStr.length > 1 && isNaN(Number(cellStr))) {
            name = cellStr;
            break;
          }
        }

        results.push({
          name: name || 'بدون اسم',
          phone,
          isDuplicate: false,
        });
      }
    }
    return results;
  };

  const parseWord = async (file: File): Promise<ParsedLead[]> => {
    const mammoth = await import('mammoth');
    const buffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const text = result.value;
    return extractFromText(text);
  };

  const parsePdf = async (file: File): Promise<ParsedLead[]> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return extractFromText(fullText);
  };

  const extractFromText = (text: string): ParsedLead[] => {
    const results: ParsedLead[] = [];
    const lines = text.split(/\n|,/).filter(l => l.trim());

    for (const line of lines) {
      const phone = extractPhone(line);
      if (!phone) continue;

      // Extract name: text before/around the phone number
      let name = line.replace(phone, '').trim();
      name = name.replace(/[:\-–]/g, '').trim();
      if (!name || name.length < 2) name = 'بدون اسم';

      results.push({ name, phone, isDuplicate: false });
    }
    return results;
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setParsing(true);
    setError('');
    setParsed([]);

    try {
      let leads: ParsedLead[] = [];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        leads = await parseExcel(selectedFile);
      } else if (ext === 'docx' || ext === 'doc') {
        leads = await parseWord(selectedFile);
      } else if (ext === 'pdf') {
        leads = await parsePdf(selectedFile);
      } else {
        setError('صيغة الملف غير مدعومة. استخدم Excel, Word, أو PDF');
        setParsing(false);
        return;
      }

      if (leads.length === 0) {
        setError('لم يتم العثور على أي أرقام تليفونات في الملف');
        setParsing(false);
        return;
      }

      // Remove duplicates within the file itself (same phone appearing twice in file)
      const uniqueMap = new Map<string, ParsedLead>();
      for (const lead of leads) {
        if (!uniqueMap.has(lead.phone)) uniqueMap.set(lead.phone, lead);
      }
      const uniqueLeads = Array.from(uniqueMap.values());

      // Check against existing leads in database
      const { data: existingLeads } = await supabaseAdmin.from('leads').select('id, name, phone');
      const existingPhoneMap = new Map(
        (existingLeads || []).map((l: any) => [l.phone.replace(/[\s\-\(\)]/g, ''), l])
      );

      const finalLeads = uniqueLeads.map(lead => {
        const existing = existingPhoneMap.get(lead.phone);
        if (existing) {
          return { ...lead, isDuplicate: true, existingName: existing.name, existingId: existing.id };
        }
        return lead;
      });

      setParsed(finalLeads);
    } catch (err: any) {
      setError('حدث خطأ في قراءة الملف: ' + err.message);
    }

    setParsing(false);
  };

  const handleImport = async (importDuplicatesToo: boolean) => {
    setImporting(true);
    const toImport = importDuplicatesToo ? parsed : parsed.filter(l => !l.isDuplicate);

    for (const lead of toImport) {
      if (lead.isDuplicate && lead.existingId) {
        // Log as duplicate note instead of creating new lead
        await supabaseAdmin.from('duplicate_leads').insert({
          existing_lead_id: lead.existingId,
          name: lead.name,
          phone: lead.phone,
          source_note: `مستورد من ملف: ${file?.name}`,
        });
      } else {
        await supabaseAdmin.from('leads').insert({
          name: lead.name,
          phone: lead.phone,
          source: 'manual',
          status: 'new',
          notes: `مستورد من ملف: ${file?.name}`,
        });
      }
    }

    setImporting(false);
    setDone(true);
  };

  const newLeadsCount = parsed.filter(l => !l.isDuplicate).length;
  const duplicateCount = parsed.filter(l => l.isDuplicate).length;

  const inputStyle = {
    padding: '10px 14px', borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '13px', fontFamily: 'Cairo, sans-serif', outline: 'none',
  };

  if (done) return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>تم الاستيراد بنجاح!</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>تم إضافة {newLeadsCount} ليد جديد للنظام</p>
      <button onClick={() => router.push('/crm/leads')} style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 32px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
        الذهاب للليدز
      </button>
    </div>
  );

  return (
    <div style={{ padding: '40px', color: 'white', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>استيراد ليدز</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>رفع ملف Excel, Word, أو PDF يحتوي على بيانات ليدز</p>
      </div>

      {!file && (
        <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '20px', padding: '60px 40px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📂</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px', fontSize: '14px' }}>
            اختر ملف Excel (كل التابات), Word, أو PDF يحتوي على أسماء وأرقام تليفونات
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.docx,.doc,.pdf"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={{ backgroundColor: '#1B4B8A', color: 'white', padding: '12px 32px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}>
            اختر ملف
          </label>
        </div>
      )}

      {parsing && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
          جاري قراءة الملف وتحليل البيانات...
        </div>
      )}

      {error && (
        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444', marginTop: '20px' }}>
          {error}
        </div>
      )}

      {!parsing && parsed.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1, padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>ليدز جديدة</p>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#25D366', margin: 0 }}>{newLeadsCount}</p>
            </div>
            <div style={{ flex: 1, padding: '20px', borderRadius: '16px', backgroundColor: 'rgba(255,150,0,0.08)', border: '1px solid rgba(255,150,0,0.25)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 6px' }}>أرقام مكررة (موجودة بالفعل)</p>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#ff9600', margin: 0 }}>{duplicateCount}</p>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0 }}>
                  {['الاسم', 'التليفون', 'الحالة'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.map((lead, i) => (
                  <tr key={i} style={{ backgroundColor: lead.isDuplicate ? 'rgba(255,150,0,0.06)' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 16px', fontSize: '13px' }}>{lead.name}</td>
                    <td style={{ padding: '10px 16px', fontSize: '13px', direction: 'ltr', textAlign: 'right' }}>{lead.phone}</td>
                    <td style={{ padding: '10px 16px', fontSize: '11px' }}>
                      {lead.isDuplicate ? (
                        <span style={{ color: '#ff9600' }}>⚠️ مكرر — موجود باسم "{lead.existingName}"</span>
                      ) : (
                        <span style={{ color: '#25D366' }}>✓ جديد</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => { setFile(null); setParsed([]); }} style={{ padding: '14px 24px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
              إلغاء
            </button>
            {duplicateCount > 0 && (
              <button onClick={() => handleImport(true)} disabled={importing} style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(255,150,0,0.15)', border: '1px solid rgba(255,150,0,0.3)', color: '#ff9600', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
                استيراد الكل ({parsed.length}) + تسجيل المكررين كملاحظة
              </button>
            )}
            <button onClick={() => handleImport(false)} disabled={importing} style={{ flex: 1, padding: '14px', borderRadius: '12px', backgroundColor: '#1B4B8A', border: 'none', color: 'white', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 700 }}>
              {importing ? 'جاري الاستيراد...' : `استيراد الجديد فقط (${newLeadsCount})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}