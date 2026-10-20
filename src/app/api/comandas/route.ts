import { getSession } from '@/lib/auth';
import { abrirComanda, getComandas } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mesaIdParam = searchParams.get('mesa_id');
    const statusParam = searchParams.get('status');

    const filters: { mesa_id?: number; status?: string } = {};
    if (mesaIdParam) filters.mesa_id = parseInt(mesaIdParam, 10);
    if (statusParam) filters.status = statusParam;

    const comandas = await getComandas(filters);
    return NextResponse.json({ comandas });
  } catch (error: any) {
    console.error('Erro ao listar comandas:', error);
    return NextResponse.json({ error: 'Erro ao listar comandas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const { mesa_id } = body;

    if (!mesa_id) {
      return NextResponse.json({ error: 'ID da mesa é obrigatório' }, { status: 400 });
    }

    const novaComanda = await abrirComanda(Number(mesa_id), session.id);
    return NextResponse.json({ success: true, comanda: novaComanda }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao abrir comanda:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao abrir comanda' },
      { status: 400 }
    );
  }
}
