import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`login:${ip}`, 5, 60000)) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { data: user } = await supabase
      .from('crm_users')
      .select('*')
      .eq('email', email)
      .eq('active', true)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غلط' }, { status: 401 });
    }

    const isHashed = user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$');

    if (isHashed) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غلط' }, { status: 401 });
      }
    } else {
      if (user.password !== password) {
        return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غلط' }, { status: 401 });
      }
      const hashed = await bcrypt.hash(password, 10);
      await supabase.from('crm_users').update({ password: hashed }).eq('id', user.id);
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch {
    return NextResponse.json({ error: 'خطأ في السيرفر' }, { status: 500 });
  }
}
