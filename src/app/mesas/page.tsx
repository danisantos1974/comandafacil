'use client';

import Navbar from '@/components/Navbar';
import { Mesa } from '@/lib/types';
import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Sparkles,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MesasPage() {
  const router = useRouter();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingMesaId, setOpeningMesaId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todas' | 'disponivel' | 'ocupada'>('todas');

  const fetchMesas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/mesas');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setMesas(data.mesas || []);
    } catch (err: any) {
      setError('Erro ao carregar mesas. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMesas();
  }, []);

  const handleAbrirComanda = async (mesaId: number, mesaNumero: number) => {
    if (!confirm(`Deseja realmente abrir uma comanda para a Mesa ${mesaNumero}?`)) {
      return;
    }

    try {
      setOpeningMesaId(mesaId);
      setError(null);
      const res = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa_id: mesaId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao abrir comanda');
        setOpeningMesaId(null);
        return;
      }

      // Redireciona direto para a comanda aberta para começar a adicionar itens
      router.push(`/comanda/${data.comanda.id}`);
    } catch (err: any) {
      alert('Erro ao abrir comanda');
      setOpeningMesaId(null);
    }
  };

  const mesasFiltradas = mesas.filter((m) => {
    if (filter === 'disponivel') return m.status === 'disponivel';
    if (filter === 'ocupada') return m.status === 'ocupada';
    return true;
  });

  const totalMesas = mesas.length;
  const mesasLivres = mesas.filter((m) => m.status === 'disponivel').length;
  const mesasOcupadas = mesas.filter((m) => m.status === 'ocupada').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <UtensilsCrossed className="w-6 h-6 text-orange-600" />
              Mapa de Mesas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe a ocupação do salão e inicie novos atendimentos com um clique.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchMesas}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Métricas / Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Mesas</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalMesas}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <button
            onClick={() => setFilter(filter === 'disponivel' ? 'todas' : 'disponivel')}
            className={`p-5 rounded-2xl border text-left transition shadow-xs flex items-center justify-between cursor-pointer ${
              filter === 'disponivel'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Mesas Disponíveis</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{mesasLivres}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={() => setFilter(filter === 'ocupada' ? 'todas' : 'ocupada')}
            className={`p-5 rounded-2xl border text-left transition shadow-xs flex items-center justify-between cursor-pointer ${
              filter === 'ocupada'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Mesas Ocupadas</span>
              <div className="text-2xl font-bold text-amber-700 mt-1">{mesasOcupadas}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Coffee className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Filtros em Pílulas */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>
          <button
            onClick={() => setFilter('todas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'todas'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todas ({totalMesas})
          </button>
          <button
            onClick={() => setFilter('disponivel')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'disponivel'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Disponíveis ({mesasLivres})
          </button>
          <button
            onClick={() => setFilter('ocupada')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              filter === 'ocupada'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            Ocupadas ({mesasOcupadas})
          </button>
        </div>

        {/* Grid de Mesas */}
        {loading && mesas.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Carregando mesas do salão...</p>
          </div>
        ) : mesasFiltradas.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
            <Coffee className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium">Nenhuma mesa encontrada com esse filtro.</p>
            <button
              onClick={() => setFilter('todas')}
              className="mt-3 text-xs text-orange-600 hover:underline font-semibold cursor-pointer"
            >
              Ver todas as mesas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {mesasFiltradas.map((mesa) => {
              const isOcupada = mesa.status === 'ocupada';
              const isOpening = openingMesaId === mesa.id;

              return (
                <div
                  key={mesa.id}
                  className={`relative rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-xs ${
                    isOcupada
                      ? 'bg-gradient-to-b from-white to-amber-50/40 border-amber-200 hover:border-amber-300'
                      : 'bg-gradient-to-b from-white to-emerald-50/30 border-slate-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Badge de Status da Mesa */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isOcupada
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOcupada ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`}
                        />
                        {isOcupada ? 'Ocupada' : 'Disponível'}
                      </span>

                      {isOcupada && mesa.comanda_ativa_id && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          Comanda #{mesa.comanda_ativa_id}
                        </span>
                      )}
                    </div>

                    {/* Número da Mesa */}
                    <div className="text-center py-2">
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Mesa</span>
                      <div className="text-4xl font-extrabold text-slate-800 tracking-tight">
                        {mesa.numero.toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>

                  {/* Ações da Mesa */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    {isOcupada ? (
                      <button
                        onClick={() => {
                          if (mesa.comanda_ativa_id) {
                            router.push(`/comanda/${mesa.comanda_ativa_id}`);
                          } else {
                            // Se estiver ocupada sem ID direto, busca
                            router.push(`/comandas?mesa_id=${mesa.id}`);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 transition shadow-xs cursor-pointer"
                      >
                        <span>Ver Comanda</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAbrirComanda(mesa.id, mesa.numero)}
                        disabled={isOpening}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs disabled:opacity-60 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>{isOpening ? 'Abrindo...' : 'Abrir Comanda'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
