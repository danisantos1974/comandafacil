'use client';

import Navbar from '@/components/Navbar';
import { Comanda, Mesa } from '@/lib/types';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Filter,
  Receipt,
  RefreshCw,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function ComandasList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMesa = searchParams.get('mesa_id') || '';

  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'todas' | 'aberta' | 'finalizada'>('todas');
  const [selectedMesa, setSelectedMesa] = useState<string>(initialMesa);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [comandasRes, mesasRes] = await Promise.all([
        fetch('/api/comandas'),
        fetch('/api/mesas'),
      ]);

      if (comandasRes.status === 401) {
        router.push('/login');
        return;
      }

      const comandasData = await comandasRes.json();
      const mesasData = await mesasRes.json();

      setComandas(comandasData.comandas || []);
      setMesas(mesasData.mesas || []);
    } catch (err) {
      console.error('Erro ao carregar comandas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

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

  const comandasFiltradas = comandas.filter((c) => {
    if (statusFilter !== 'todas' && c.status !== statusFilter) return false;
    if (selectedMesa && c.mesa_id.toString() !== selectedMesa) return false;
    return true;
  });

  const totalFaturado = comandas
    .filter((c) => c.status === 'finalizada')
    .reduce((sum, c) => sum + (c.valor_total || 0), 0);

  const totalAbertas = comandas.filter((c) => c.status === 'aberta').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Receipt className="w-6 h-6 text-orange-600" />
              Histórico de Comandas
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Registro completo de todas as comandas abertas e finalizadas armazenadas no banco de dados.
            </p>
          </div>

          <button
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Resumo Financeiro e Operacional */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Comandas</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{comandas.length}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-500">Comandas em Aberto</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{totalAbertas}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Total Faturado</span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalFaturado)}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            <button
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                statusFilter === 'todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('aberta')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                statusFilter === 'aberta'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Abertas
            </button>
            <button
              onClick={() => setStatusFilter('finalizada')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
                statusFilter === 'finalizada'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Finalizadas
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filtrar por Mesa:</label>
            <select
              value={selectedMesa}
              onChange={(e) => setSelectedMesa(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="">Todas as Mesas</option>
              {mesas.map((m) => (
                <option key={m.id} value={m.id}>
                  Mesa {m.numero.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            {selectedMesa && (
              <button
                onClick={() => setSelectedMesa('')}
                className="text-xs text-orange-600 font-semibold hover:underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Comandas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading && comandas.length === 0 ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Carregando comandas...</p>
            </div>
          ) : comandasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Nenhuma comanda encontrada.</p>
              <p className="text-xs text-slate-400 mt-1">Abra uma comanda no mapa de mesas para começar.</p>
              <Link
                href="/mesas"
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Ir para Mapa de Mesas</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Comanda</th>
                    <th className="py-3 px-4">Mesa</th>
                    <th className="py-3 px-4">Atendente</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Abertura</th>
                    <th className="py-3 px-4">Fechamento</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comandasFiltradas.map((c) => {
                    const isAberta = c.status === 'aberta';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                          #{c.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                            <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                            Mesa {c.mesa_numero?.toString().padStart(2, '0') || c.mesa_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                          {c.usuario_nome || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isAberta
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isAberta ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                              }`}
                            />
                            {isAberta ? 'Aberta' : 'Finalizada'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(c.data_abertura)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {c.data_fechamento ? formatDate(c.data_fechamento) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                          {formatCurrency(c.valor_total)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/comanda/${c.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition"
                          >
                            <span>Detalhes</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ComandasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando histórico...</div>}>
      <ComandasList />
    </Suspense>
  );
}
