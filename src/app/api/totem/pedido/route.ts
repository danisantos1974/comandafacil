import { abrirComanda, adicionarItemComanda, getComandas, getMesas, getProdutos } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mesa_id, itens } = body;

    if (!mesa_id) {
      return NextResponse.json({ error: 'Mesa é obrigatória' }, { status: 400 });
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return NextResponse.json({ error: 'Adicione pelo menos um item ao pedido' }, { status: 400 });
    }

    // 1. Verificar se a mesa existe
    const mesas = await getMesas();
    const mesa = mesas.find((m) => m.id === Number(mesa_id));
    if (!mesa) {
      return NextResponse.json({ error: 'Mesa não encontrada' }, { status: 404 });
    }

    // 2. Verificar se já existe comanda aberta para esta mesa
    let comandaId = mesa.comanda_ativa_id;

    if (!comandaId) {
      // Abre uma nova comanda associada ao sistema/atendente (id: 2 ou id: 1)
      const novaComanda = await abrirComanda(mesa.id, 2);
      comandaId = novaComanda.id;
    }

    // 3. Adicionar cada item do pedido à comanda
    let valorTotal = 0;
    for (const item of itens) {
      if (item.produto_id && item.quantidade > 0) {
        const res = await adicionarItemComanda(comandaId, Number(item.produto_id), Number(item.quantidade));
        valorTotal = res.valor_total;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pedido realizado com sucesso pelo Totem!',
      comanda_id: comandaId,
      mesa_numero: mesa.numero,
      valor_total: valorTotal,
    });
  } catch (error: any) {
    console.error('Erro no pedido do totem:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar pedido do totem' },
      { status: 500 }
    );
  }
}
