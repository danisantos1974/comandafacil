import { getSession } from '@/lib/auth';
import { adicionarItemComanda, removerItemComanda } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
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
    const { produto_id, quantidade } = body;

    if (!produto_id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }

    const qty = quantidade ? parseInt(quantidade, 10) : 1;
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser um número maior que zero' }, { status: 400 });
    }

    const result = await adicionarItemComanda(comandaId, Number(produto_id), qty);

    return NextResponse.json({
      success: true,
      item: result.item,
      valor_total: result.valor_total,
    });
  } catch (error: any) {
    console.error('Erro ao adicionar item:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao adicionar item à comanda' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemIdParam = searchParams.get('item_id');

    if (!itemIdParam) {
      return NextResponse.json({ error: 'ID do item é obrigatório' }, { status: 400 });
    }

    const itemId = parseInt(itemIdParam, 10);
    const result = await removerItemComanda(itemId);

    return NextResponse.json({
      success: true,
      valor_total: result.valor_total,
    });
  } catch (error: any) {
    console.error('Erro ao remover item:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao remover item' },
      { status: 400 }
    );
  }
}
