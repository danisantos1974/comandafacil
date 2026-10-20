import { getDatabaseStatus, getMesas, getProdutos, getComandas } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const status = getDatabaseStatus();
    const [mesas, produtos, comandas] = await Promise.all([
      getMesas().catch(() => []),
      getProdutos().catch(() => []),
      getComandas().catch(() => []),
    ]);

    return NextResponse.json({
      status: 'ok',
      database: status,
      counts: {
        mesas: mesas.length,
        produtos: produtos.length,
        comandas: comandas.length,
        comandas_abertas: comandas.filter((c) => c.status === 'aberta').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }
}
