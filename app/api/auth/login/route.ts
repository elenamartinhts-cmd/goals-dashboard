import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, signToken, cookieName, cookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = signToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(), token, cookieOptions());
  return res;
}
