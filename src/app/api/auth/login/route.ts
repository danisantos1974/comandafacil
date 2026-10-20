import { comparePassword, COOKIE_NAME, signSession } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user || !user.senha) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(senha, user.senha);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    const sessionData = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
    };

    const token = await signSession(sessionData);

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar login.' },
      { status: 500 }
    );
  }
}
