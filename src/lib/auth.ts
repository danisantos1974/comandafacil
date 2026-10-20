import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { AuthSession } from './types';

const SECRET_KEY = process.env.JWT_SECRET || 'comanda-facil-secret-jwt-key-development-2026';
const key = new TextEncoder().encode(SECRET_KEY);

export const COOKIE_NAME = 'comanda_token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: AuthSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifySession(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AuthSession;
  } catch {
    return null;
  }
}

export async function getSession(req?: NextRequest): Promise<AuthSession | null> {
  try {
    let token: string | undefined;

    if (req) {
      token = req.cookies.get(COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}
