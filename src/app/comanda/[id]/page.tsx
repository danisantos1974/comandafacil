'use client';

import Navbar from '@/components/Navbar';
import { Comanda, ItemComanda, Produto } from '@/lib/types';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Minus,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  Trash2,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ComandaDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const comandaId = params.id as string;

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de produtos
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [adicionandoId, setAdicionandoId] = useState<number | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  // Carregar dados da comanda e catálogo de produtos
  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [comandaRes, produtosRes] = await Promise.all([
        fetch(`/api/comandas/${comandaId}`),
        fetch('/api/produtos'),
      ]);

      if (comandaRes.status === 401) {
        router.push('/login');
        return;
      }

      if (!comandaRes.ok) {
        throw new Error('Comanda não encontrada');
      }

      const comandaData = await comandaRes.json();
      const produtosData = await produtosRes.json();

      setComanda(comandaData.comanda);
      setProdutos(produtosData.produtos || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar comanda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (comandaId) {
      carregarDados();
    }
  }, [comandaId]);

  // Adicionar produto à comanda (RF05)
  const handleAdicionarProduto = async (produtoId: number, quantidade: number = 1) => {
    if (!comanda || comanda.status === 'finalizada') return;

    try {
      setAdicionandoId(produtoId);
      const res = await fetch(`/api/comandas/${comandaId}/itens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto_id: produtoId, quantidade }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao adicionar item à comanda');
        return;
      }

      // Recarrega os dados para exibir tudo atualizado
      await carregarDados();
    } catch (err: any) {
      alert('Erro ao adicionar produto');
    } finally {
      setAdicionandoId(null);
    }
  };

  // Remover item da comanda
  const handleRemoverItem = async (itemId: number) => {
    if (!comanda || comanda.status === 'finalizada') return;
    if (!confirm('Deseja remover este item da comanda?')) return;

    try {
      const res = await fetch(`/api/comandas/${comandaId}/itens?item_id=${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao remover item');
        return;
      }

      await carregarDados();
    } catch (err) {
      alert('Erro ao remover item');
    }
  };

  // Finalizar comanda (RF08)
  const handleFinalizarComanda = async () => {
    if (!comanda || comanda.status === 'finalizada') return;

    const totalFormatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(comanda.valor_total);

    const confirmado = confirm(
      `Confirma a finalização da Comanda #${comanda.id} da Mesa ${comanda.mesa_numero}?\n\nValor Total: ${totalFormatado}\n\nA mesa será liberada automaticamente.`
    );

    if (!confirmado) return;

    try {
      setFinalizando(true);
      const res = await fetch(`/api/comandas/${comandaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalizar' }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao finalizar comanda');
        setFinalizando(false);
        return;
      }

      // Atualiza comanda na tela
      await carregarDados();
    } catch (err) {
      alert('Erro ao finalizar comanda');
      setFinalizando(false);
    }
  };

  // Categorias disponíveis para filtro
  const categorias = ['todas', ...Array.from(new Set(produtos.map((p) => p.categoria)))];

  const produtosFiltrados = produtos.filter((prod) => {
    const matchCat = selectedCategoria === 'todas' || prod.categoria === selectedCategoria;
    const matchSearch =
      prod.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !comanda) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <UtensilsCrossed className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Carregando detalhes da comanda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !comanda) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-800">Comanda não encontrada</h2>
            <p className="text-sm text-slate-500 mt-1">{error || 'Esta comanda não existe ou foi removida.'}</p>
            <Link
              href="/mesas"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Mapa de Mesas</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isFinalizada = comanda.status === 'finalizada';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Barra Superior / Navegação e Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/mesas"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200 transition shadow-xs"
              title="Voltar para as mesas"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Comanda #{comanda.id}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isFinalizada
                      ? 'bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFinalizada ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  {isFinalizada ? 'Finalizada' : 'Aberta'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
                  Mesa {comanda.mesa_numero?.toString().padStart(2, '0') || comanda.mesa_id}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Atendente: {comanda.usuario_nome || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Abertura: {formatDate(comanda.data_abertura)}
                </span>
                {isFinalizada && comanda.data_fechamento && (
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Fechada em: {formatDate(comanda.data_fechamento)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Imprimir Recibo</span>
            </button>
          </div>
        </div>

        {/* Banner informativo se estiver finalizada */}
        {isFinalizada && (
          <div className="my-5 p-4 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 text-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-bold">Esta comanda foi finalizada e arquivada no banco de dados.</span>
                <p className="text-xs text-slate-500">
                  O valor total de {formatCurrency(comanda.valor_total)} foi registrado com sucesso. Novos itens não podem ser adicionados.
                </p>
              </div>
            </div>
            <Link
              href="/mesas"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline flex-shrink-0"
            >
              Voltar às Mesas
            </Link>
          </div>
        )}

        {/* Layout Principal: 2 Colunas (Itens da Comanda vs Catálogo de Produtos) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Coluna 1: Itens da Comanda e Totalizador (RF06, RF07, RF08) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Card de Itens Adicionados */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-600" />
                  <h2 className="text-base font-bold text-slate-800">
                    Itens do Pedido ({comanda.itens?.length || 0})
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Total de Itens: {comanda.itens?.reduce((acc, i) => acc + i.quantidade, 0) || 0}
                </span>
              </div>

              {/* Tabela ou Lista de Itens */}
              <div className="divide-y divide-slate-100 overflow-x-auto min-h-[220px]">
                {!comanda.itens || comanda.itens.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Nenhum item adicionado ainda.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isFinalizada
                        ? 'Nenhum item foi registrado nesta comanda.'
                        : 'Selecione produtos no catálogo ao lado para adicionar ao pedido.'}
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-2.5 px-4 sm:px-6">Produto</th>
                        <th className="py-2.5 px-2 text-center">Qtd</th>
                        <th className="py-2.5 px-3 text-right">Preço Unit.</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        {!isFinalizada && <th className="py-2.5 px-3 text-center">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comanda.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 sm:px-6">
                            <div className="font-semibold text-slate-800">{item.produto_nome}</div>
                            {item.produto_categoria && (
                              <span className="inline-block text-[10px] uppercase font-bold text-slate-400">
                                {item.produto_categoria}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-slate-800">
                            <span className="px-2 py-1 rounded-md bg-slate-100 text-xs">
                              {item.quantidade}x
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 text-xs">
                            {formatCurrency(item.preco_unitario)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {formatCurrency(item.quantidade * item.preco_unitario)}
                          </td>
                          {!isFinalizada && (
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleRemoverItem(item.id)}
                                title="Remover item da comanda"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Totalizador em Destaque (RF07) */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Valor Total da Comanda
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                    {formatCurrency(comanda.valor_total)}
                  </div>
                </div>

                {!isFinalizada && (
                  <button
                    onClick={handleFinalizarComanda}
                    disabled={finalizando || !comanda.itens || comanda.itens.length === 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle className="w-5 h-5 text-slate-950" />
                    <span>{finalizando ? 'Finalizando...' : 'Finalizar Comanda'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Coluna 2: Adicionar Produtos à Comanda (RF05) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-slate-800 text-base">Adicionar Produtos</h3>
                </div>
                {isFinalizada && (
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    Bloqueado (Finalizada)
                  </span>
                )}
              </div>

              {/* Barra de Pesquisa de Produtos */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto pelo nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isFinalizada}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition disabled:bg-slate-100"
                />
              </div>

              {/* Categorias Pílulas */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoria(cat)}
                    disabled={isFinalizada}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer capitalize ${
                      selectedCategoria === cat
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Lista de Produtos para Adicionar */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
                {produtosFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Nenhum produto encontrado com este filtro.
                  </div>
                ) : (
                  produtosFiltrados.map((produto) => {
                    const isAdicionando = adicionandoId === produto.id;

                    return (
                      <div
                        key={produto.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-orange-200 hover:bg-orange-50/20 transition flex items-center justify-between gap-3 bg-white"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-slate-800 truncate">
                            {produto.nome}
                          </div>
                          {produto.descricao && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {produto.descricao}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-orange-600">
                              {formatCurrency(produto.preco)}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              {produto.categoria}
                            </span>
                          </div>
                        </div>

                        {!isFinalizada && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdicionarProduto(produto.id, 1)}
                              disabled={isAdicionando}
                              title="Adicionar 1 unidade"
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-95 transition shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer flex-shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isAdicionando ? '...' : '+1'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
