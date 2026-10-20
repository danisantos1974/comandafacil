import { getSession } from '@/lib/auth';
import { getMesas } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const mesas = await getMesas();
    return NextResponse.json({ mesas });
  } catch (error: any) {
    console.error('Erro ao listar mesas:', error);
    return NextResponse.json({ error: 'Erro ao listar mesas' }, { status: 500 });
  }
}
