import { getSession } from '@/lib/auth';
import { createProduto, getProdutos } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const produtos = await getProdutos();
    return NextResponse.json({ produtos });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ error: 'Erro ao listar produtos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (session.tipo !== 'administrador') {
      return NextResponse.json(
        { error: 'Apenas administradores podem cadastrar produtos.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nome, descricao, preco, categoria } = body;

    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 });
    }

    if (preco === undefined || preco === null || isNaN(Number(preco)) || Number(preco) < 0) {
      return NextResponse.json({ error: 'Preço válido é obrigatório (maior ou igual a zero).' }, { status: 400 });
    }

    if (!categoria || typeof categoria !== 'string' || !categoria.trim()) {
      return NextResponse.json({ error: 'Categoria é obrigatória.' }, { status: 400 });
    }

    const novoProduto = await createProduto({
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : '',
      preco: Number(Number(preco).toFixed(2)),
      categoria: categoria.trim(),
    });

    return NextResponse.json({ success: true, produto: novoProduto }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao cadastrar produto:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao cadastrar produto' },
      { status: 500 }
    );
  }
}
