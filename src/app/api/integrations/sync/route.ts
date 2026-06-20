import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
);

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`sync:${ip}`, 3, 60000)) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 });
    }

    const { platform } = await req.json();

    const { data: integration } = await supabase
      .from('ad_integrations')
      .select('*')
      .eq('platform', platform)
      .eq('active', true)
      .single();

    if (!integration) {
      return NextResponse.json({ error: 'No active integration found' }, { status: 400 });
    }

    if (platform === 'facebook') {
      return await syncFacebook(integration);
    }

    return NextResponse.json({ error: 'Sync not supported for this platform' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function syncFacebook(integration: any) {
  const pageId = integration.account_id;
  const token = integration.access_token;
  let synced = 0;

  const formsRes = await fetch(
    `${FB_GRAPH_URL}/${pageId}/leadgen_forms?access_token=${token}`,
  );

  if (!formsRes.ok) {
    const err = await formsRes.json();
    return NextResponse.json(
      { error: 'Facebook API error', details: err.error?.message },
      { status: 400 },
    );
  }

  const formsData = await formsRes.json();

  for (const form of formsData.data || []) {
    const leadsRes = await fetch(
      `${FB_GRAPH_URL}/${form.id}/leads?access_token=${token}&limit=50`,
    );

    if (!leadsRes.ok) continue;

    const leadsData = await leadsRes.json();

    for (const lead of leadsData.data || []) {
      const externalId = `fb_${lead.id}`;

      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('external_id', externalId)
        .single();

      if (existing) continue;

      const fields: Record<string, string> = {};
      for (const f of lead.field_data || []) {
        fields[f.name] = f.values?.[0] || '';
      }

      await supabase.from('leads').insert({
        name: fields.full_name || fields.first_name || 'Facebook Lead',
        phone: fields.phone_number || fields.phone || '',
        email: fields.email || '',
        source: 'facebook',
        status: 'new',
        external_id: externalId,
        notes: `Facebook Lead Ad - Form: ${form.name || form.id}`,
        assigned_to: null,
      });

      synced++;
    }
  }

  await supabase
    .from('ad_integrations')
    .update({ last_sync: new Date().toISOString() })
    .eq('id', integration.id);

  return NextResponse.json({ status: 'ok', synced });
}
