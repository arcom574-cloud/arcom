import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { action, table, data, filters, select, order, limit: lim, match } = await req.json();

    if (!table || !action) {
      return NextResponse.json({ error: 'Missing table or action' }, { status: 400 });
    }

    let query: any;

    switch (action) {
      case 'select': {
        query = supabase.from(table).select(select || '*');
        if (filters) {
          for (const f of filters) {
            if (f.op === 'eq') query = query.eq(f.col, f.val);
            else if (f.op === 'neq') query = query.neq(f.col, f.val);
            else if (f.op === 'in') query = query.in(f.col, f.val);
            else if (f.op === 'is') query = query.is(f.col, f.val);
            else if (f.op === 'not') query = query.not(f.col, f.mod, f.val);
            else if (f.op === 'gte') query = query.gte(f.col, f.val);
            else if (f.op === 'lte') query = query.lte(f.col, f.val);
            else if (f.op === 'lt') query = query.lt(f.col, f.val);
            else if (f.op === 'gt') query = query.gt(f.col, f.val);
            else if (f.op === 'like') query = query.like(f.col, f.val);
            else if (f.op === 'single') query = query.single();
          }
        }
        if (order) {
          for (const o of Array.isArray(order) ? order : [order]) {
            query = query.order(o.col, { ascending: o.asc ?? false });
          }
        }
        if (lim) query = query.limit(lim);
        break;
      }
      case 'insert': {
        query = supabase.from(table).insert(data);
        if (select) query = query.select(select);
        break;
      }
      case 'update': {
        query = supabase.from(table).update(data);
        if (match) {
          for (const [k, v] of Object.entries(match)) {
            query = query.eq(k, v);
          }
        }
        break;
      }
      case 'upsert': {
        query = supabase.from(table).upsert(data, { onConflict: match?.onConflict || 'id' });
        break;
      }
      case 'delete': {
        query = supabase.from(table).delete();
        if (match) {
          for (const [k, v] of Object.entries(match)) {
            query = query.eq(k, v);
          }
        }
        break;
      }
      case 'count': {
        query = supabase.from(table).select('*', { count: 'exact', head: true });
        if (filters) {
          for (const f of filters) {
            if (f.op === 'eq') query = query.eq(f.col, f.val);
          }
        }
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await query;
    return NextResponse.json({ data: result.data, error: result.error?.message, count: result.count });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
