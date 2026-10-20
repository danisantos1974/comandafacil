import { getSession } from '@/lib/auth';
import { finalizarComanda, getComandaById } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const comandaId = parseInt(resolvedParams.id, 10);
    if (isNaN(comandaId)) {
      return NextResponse.json({ error: 'ID de comanda inválido' }, { status: 400 });
    }

    const comanda = await getComandaById(comandaId);
    if (!comanda) {
      return NextResponse.json({ error: 'Comanda não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ comanda });
  } catch (error: any) {
    console.error('Erro ao buscar comanda:', error);
    return NextResponse.json({ error: 'Erro ao buscar comanda' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const comandaId = parseInt(resolvedParams.id, 10);
    if (isNaN(comandaId)) {
      return NextResponse.json({ error: 'ID de comanda inválido' }, { status: 400 });
    }

    const body = await req.json();
    if (body.action === 'finalizar' || body.status === 'finalizada') {
      const comandaFinalizada = await finalizarComanda(comandaId);
      return NextResponse.json({
        success: true,
        message: 'Comanda finalizada com sucesso',
        comanda: comandaFinalizada,
      });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Erro ao atualizar comanda:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar comanda' },
      { status: 400 }
    );
  }
}
