import { getSession } from '@/lib/auth';
import { deleteProduto, getProdutoById, updateProduto } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const prodId = parseInt(resolvedParams.id, 10);
    if (isNaN(prodId)) {
      return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
    }

    const produto = await getProdutoById(prodId);
    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ produto });
  } catch (error: any) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.tipo !== 'administrador') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar produtos.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const prodId = parseInt(resolvedParams.id, 10);
    if (isNaN(prodId)) {
      return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { nome, descricao, preco, categoria } = body;

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
    }

    if (preco === undefined || preco === null || isNaN(Number(preco)) || Number(preco) < 0) {
      return NextResponse.json({ error: 'Preço válido é obrigatório.' }, { status: 400 });
    }

    if (!categoria || typeof categoria !== 'string' || !categoria.trim()) {
      return NextResponse.json({ error: 'Categoria é obrigatória.' }, { status: 400 });
    }

    const atualizado = await updateProduto(prodId, {
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : '',
      preco: Number(Number(preco).toFixed(2)),
      categoria: categoria.trim(),
    });

    if (!atualizado) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, produto: atualizado });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar produto' },
      { status: 500 }
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

    if (session.tipo !== 'administrador') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir produtos.' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const prodId = parseInt(resolvedParams.id, 10);
    if (isNaN(prodId)) {
      return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
    }

    const deleted = await deleteProduto(prodId);
    if (!deleted) {
      return NextResponse.json({ error: 'Produto não encontrado ou já removido.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Produto excluído com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao excluir produto' },
      { status: 500 }
    );
  }
}
