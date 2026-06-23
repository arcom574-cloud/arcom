import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`google-webhook:${ip}`, 30, 60000)) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
    }

    const body = await req.json();

    const branchParam = req.nextUrl.searchParams.get('branch');
    let branchId: string | null = null;
    if (branchParam) {
      const { data: branchData } = await supabase.from('branches').select('id').eq('name', branchParam).single();
      if (branchData) branchId = branchData.id;
    }

    const { data: integration } = await supabase
      .from('ad_integrations')
      .select('*')
      .eq('platform', 'google')
      .eq('active', true)
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'No active Google integration' }, { status: 400 });
    }

    const leadId = body.lead_id || body.google_key || '';
    const externalId = `google_${leadId}`;

    if (leadId) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('external_id', externalId)
        .single();

      if (existing) {
        return NextResponse.json({ status: 'duplicate' });
      }
    }

    const userData = body.user_column_data || body.lead_data || [];
    const fields: Record<string, string> = {};
    for (const col of userData) {
      const key = (col.column_id || col.name || '').toLowerCase();
      fields[key] = col.string_value || col.value || '';
    }

    const campaignId = body.campaign_id || body.form_id || '';
    let leadBranchId = branchId;
    if (!leadBranchId && campaignId) {
      const { data: mapping } = await supabase.from('ad_form_branches').select('branch_id').eq('form_id', campaignId).single();
      if (mapping) leadBranchId = mapping.branch_id;
    }

    await supabase.from('leads').insert({
      name: fields.full_name || fields.name || 'Google Lead',
      phone: fields.phone_number || fields.phone || '',
      email: fields.email || '',
      source: 'google',
      status: 'new',
      external_id: leadId ? externalId : null,
      notes: `Google Ads Lead Form - Campaign: ${campaignId}`,
      branch_id: leadBranchId,
      assigned_to: null,
    });

    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
