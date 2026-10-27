import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = 'hsg_session';
const EXPIRES_DAYS = 30;

export function signToken(): string {
  return jwt.sign({ type: 'session' }, SECRET, { expiresIn: `${EXPIRES_DAYS}d` });
}

export function verifyToken(token: string): boolean {
  try {
    const payload = jwt.verify(token, SECRET) as { type?: string };
    return payload?.type === 'session';
  } catch {
    return false;
  }
}

export function cookieName(): string {
  return COOKIE_NAME;
}

export function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAge ?? 60 * 60 * 24 * EXPIRES_DAYS,
  };
}

export function checkPassword(input: string): boolean {
  return input === process.env.APP_PASSWORD;
}
