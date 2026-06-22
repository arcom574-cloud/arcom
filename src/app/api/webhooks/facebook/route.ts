import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
);

const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'arcom_fb_verify';
const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`fb-webhook:${ip}`, 30, 60000)) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
    }

    const signature = req.headers.get('x-hub-signature-256');
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (appSecret && signature) {
      const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    if (body.object !== 'page') {
      return NextResponse.json({ status: 'ignored' });
    }

    // Get branch from URL param
    const branchParam = req.nextUrl.searchParams.get('branch');
    let branchId: string | null = null;
    if (branchParam) {
      const { data: branchData } = await supabase.from('branches').select('id').eq('name', branchParam).single();
      if (branchData) branchId = branchData.id;
    }

    const { data: integration } = await supabase
      .from('ad_integrations')
      .select('*')
      .eq('platform', 'facebook')
      .eq('active', true)
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'No active Facebook integration' }, { status: 400 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue;

        const leadgenId = change.value?.leadgen_id;
        if (!leadgenId) continue;

        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('external_id', `fb_${leadgenId}`)
          .single();

        if (existing) continue;

        const fbRes = await fetch(
          `${FB_GRAPH_URL}/${leadgenId}?access_token=${integration.access_token}`,
        );

        if (!fbRes.ok) continue;

        const leadData = await fbRes.json();
        const fields: Record<string, string> = {};
        for (const f of leadData.field_data || []) {
          fields[f.name] = f.values?.[0] || '';
        }

        const leadName = fields.full_name || fields.first_name || 'Facebook Lead';
        await supabase.from('leads').insert({
          name: leadName,
          phone: fields.phone_number || fields.phone || '',
          email: fields.email || '',
          source: 'facebook',
          status: 'new',
          external_id: `fb_${leadgenId}`,
          notes: `Facebook Lead Ad - Form: ${change.value?.form_id || ''}`,
          assigned_to: null,
          branch_id: branchId,
        });

        const { data: admins } = await supabase.from('crm_users').select('id').eq('role', 'superadmin').eq('active', true);
        for (const admin of admins || []) {
          await supabase.from('notifications').insert({
            user_id: admin.id, type: 'new_lead',
            title: 'ليد جديد من فيسبوك',
            message: `${leadName} - ${fields.phone_number || fields.phone || ''}`,
          });
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
