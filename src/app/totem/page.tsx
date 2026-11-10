'use client';

import { Mesa, Produto } from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coffee,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CartItem {
  produto: Produto;
  quantidade: number;
}

export default function TotemPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Seleções do cliente
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [search, setSearch] = useState('');

  // Estados de confirmação
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    comandaId: number;
    mesaNumero: number;
    total: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [mesasRes, prodRes] = await Promise.all([
          fetch('/api/mesas'),
          fetch('/api/produtos'),
        ]);

        const mesasData = await mesasRes.json();
        const prodData = await prodRes.json();

        setMesas(mesasData.mesas || []);
        setProdutos(prodData.produtos || []);
      } catch (err) {
        console.error('Erro ao carregar totem:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = ['todas', ...Array.from(new Set(produtos.map((p) => p.categoria)))];

  const filteredProducts = produtos.filter((prod) => {
    const matchCat = selectedCategory === 'todas' || prod.categoria === selectedCategory;
    const matchSearch =
      prod.nome.toLowerCase().includes(search.toLowerCase()) ||
      prod.descricao.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (produto: Produto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.produto.id === produto.id);
      if (existing) {
        return prev.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removeFromCart = (produtoId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.produto.id === produtoId);
      if (!existing) return prev;
      if (existing.quantidade <= 1) {
        return prev.filter((item) => item.produto.id !== produtoId);
      }
      return prev.map((item) =>
        item.produto.id === produtoId
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      );
    });
  };

  const clearItem = (produtoId: number) => {
    setCart((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantidade, 0);
  const totalCartValue = cart.reduce(
    (acc, item) => acc + item.quantidade * item.produto.preco,
    0
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const handleFinishOrder = async () => {
    if (!selectedMesaId) {
      setErrorMsg('Por favor, selecione a sua mesa antes de confirmar.');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Seu carrinho está vazio. Adicione produtos.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch('/api/totem/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesa_id: selectedMesaId,
          itens: cart.map((i) => ({
            produto_id: i.produto.id,
            quantidade: i.quantidade,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao enviar pedido');
        setSubmitting(false);
        return;
      }

      setOrderSuccess({
        comandaId: data.comanda_id,
        mesaNumero: data.mesa_numero,
        total: data.valor_total,
      });

      setCart([]);
      setSubmitting(false);
    } catch (err) {
      setErrorMsg('Falha na comunicação com o sistema.');
      setSubmitting(false);
    }
  };

  const selectedMesa = mesas.find((m) => m.id === selectedMesaId);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Banner Kiosk */}
      <header className="bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            href="/mesas"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Voltar para a área do atendente"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Totem <span className="text-orange-500">Autoatendimento</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                Kiosk
              </span>
            </h1>
            <p className="text-xs text-slate-400">Faça seu pedido diretamente e acompanhe na sua mesa</p>
          </div>
        </div>

        {/* Mesa selecionada badge */}
        <div className="flex items-center gap-3">
          {selectedMesa ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 rounded-xl text-white font-bold shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Mesa {selectedMesa.numero.toString().padStart(2, '0')}</span>
              <button
                onClick={() => setSelectedMesaId(null)}
                className="ml-2 text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-lg transition"
              >
                Trocar
              </button>
            </div>
          ) : (
            <span className="text-xs text-amber-400 font-semibold bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-xl animate-pulse">
              Selecione sua mesa abaixo
            </span>
          )}
        </div>
      </header>

      {/* Tela de Seleção de Mesa (se ainda não escolheu) */}
      {!selectedMesaId && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 text-orange-400 mb-3 border border-orange-500/20">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Em qual mesa você está sentado?
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Toque no número da sua mesa para abrir o cardápio e iniciar seu pedido.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
            {mesas.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMesaId(m.id)}
                className="p-6 rounded-2xl bg-slate-800/80 hover:bg-orange-600/90 border border-slate-700 hover:border-orange-500 transition-all transform active:scale-95 flex flex-col items-center justify-center gap-2 group shadow-lg cursor-pointer"
              >
                <span className="text-xs uppercase font-bold text-slate-400 group-hover:text-white/80">
                  Mesa
                </span>
                <span className="text-4xl font-black text-white group-hover:scale-110 transition-transform">
                  {m.numero.toString().padStart(2, '0')}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    m.status === 'ocupada'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {m.status === 'ocupada' ? 'Comanda Aberta' : 'Livre'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cardápio e Carrinho quando Mesa Selecionada */}
      {selectedMesaId && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Coluna da Esquerda: Cardápio */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {/* Categorias e Busca */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-12">
              {filteredProducts.map((prod) => {
                const cartQty = cart.find((i) => i.produto.id === prod.id)?.quantidade || 0;

                return (
                  <div
                    key={prod.id}
                    className="p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 flex flex-col justify-between transition shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded">
                          {prod.categoria}
                        </span>
                        <span className="text-base font-extrabold text-orange-400">
                          {formatCurrency(prod.preco)}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base mt-2">{prod.nome}</h3>
                      {prod.descricao && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {prod.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                      {cartQty > 0 ? (
                        <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                          <button
                            onClick={() => removeFromCart(prod.id)}
                            className="p-1 hover:text-orange-400 transition"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-sm text-white px-1">{cartQty}</span>
                          <button
                            onClick={() => addToCart(prod)}
                            className="p-1 hover:text-orange-400 transition"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(prod)}
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white transition flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Adicionar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna da Direita: Carrinho do Totem */}
          <div className="w-full lg:w-96 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  <h2 className="font-bold text-white text-lg">Meu Pedido</h2>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {errorMsg && (
                <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Lista do Carrinho */}
              <div className="divide-y divide-slate-800/80 my-4 max-h-[420px] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Utensils className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-medium">Seu pedido está vazio</p>
                    <p className="text-xs text-slate-500 mt-1">Toque em "Adicionar" nos produtos ao lado.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.produto.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-white truncate">
                          {item.produto.nome}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatCurrency(item.produto.preco)} cada
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                          <button
                            onClick={() => removeFromCart(item.produto.id)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-white px-2">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => addToCart(item.produto)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => clearItem(item.produto.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Resumo e Botão Finalizar */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-400">Total do Pedido</span>
                <span className="text-2xl font-black text-amber-400">
                  {formatCurrency(totalCartValue)}
                </span>
              </div>

              <button
                onClick={handleFinishOrder}
                disabled={submitting || cart.length === 0}
                className="w-full py-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-xl shadow-orange-500/20 active:scale-98 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>{submitting ? 'Enviando Pedido...' : 'Confirmar e Enviar Pedido'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso do Pedido */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-white">Pedido Realizado com Sucesso!</h3>
            <p className="text-sm text-slate-400 mt-2">
              Seu pedido foi registrado para a <span className="text-orange-400 font-bold">Mesa {orderSuccess.mesaNumero.toString().padStart(2, '0')}</span> na comanda <span className="font-mono text-white font-bold">#{orderSuccess.comandaId}</span>.
            </p>

            <div className="my-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-left">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Valor Acumulado</span>
                <div className="text-xl font-black text-amber-400">
                  {formatCurrency(orderSuccess.total)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <Clock className="w-4 h-4" />
                <span>Em Preparo</span>
              </div>
            </div>

            <button
              onClick={() => {
                setOrderSuccess(null);
              }}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-500 text-white transition shadow-lg shadow-orange-600/30 cursor-pointer"
            >
              Fazer Outro Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
