'use client';

import Navbar from '@/components/Navbar';
import { Produto } from '@/lib/types';
import {
  AlertCircle,
  CheckCircle,
  Edit2,
  Package,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const CATEGORIAS_PADRAO = ['Lanches', 'Porções', 'Bebidas', 'Sobremesas', 'Pratos', 'Outros'];

export default function ProdutosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');

  // Estado do Modal (Cadastro ou Edição)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formCategoria, setFormCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/produtos');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setProdutos(data.produtos || []);
    } catch (err: any) {
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const openNewModal = () => {
    setEditingProduct(null);
    setFormNome('');
    setFormDescricao('');
    setFormPreco('');
    setFormCategoria(CATEGORIAS_PADRAO[0]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (produto: Produto) => {
    setEditingProduct(produto);
    setFormNome(produto.nome);
    setFormDescricao(produto.descricao || '');
    setFormPreco(produto.preco.toString());
    setFormCategoria(produto.categoria);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormError(null);
  };

  // Salvar produto (Cadastrar RF10 ou Alterar RF12)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações dos requisitos não funcionais
    if (!formNome.trim()) {
      setFormError('O nome do produto é obrigatório.');
      return;
    }

    const precoNum = parseFloat(formPreco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum < 0) {
      setFormError('Informe um preço válido (ex: 25.50 ou maior que 0).');
      return;
    }

    if (!formCategoria.trim()) {
      setFormError('A categoria é obrigatória.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nome: formNome.trim(),
        descricao: formDescricao.trim(),
        preco: precoNum,
        categoria: formCategoria.trim(),
      };

      const url = editingProduct ? `/api/produtos/${editingProduct.id}` : '/api/produtos';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Erro ao salvar produto.');
        setSaving(false);
        return;
      }

      setSuccessMsg(
        editingProduct
          ? `Produto "${payload.nome}" atualizado com sucesso!`
          : `Produto "${payload.nome}" cadastrado com sucesso!`
      );

      closeModal();
      await carregarProdutos();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError('Erro ao comunicar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  // Excluir produto (RF13)
  const handleDeleteProduct = async (id: number, nome: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${nome}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Erro ao excluir produto.');
        return;
      }

      setSuccessMsg(`Produto "${nome}" excluído com sucesso.`);
      await carregarProdutos();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert('Erro ao excluir produto.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const categorias = ['todas', ...Array.from(new Set(produtos.map((p) => p.categoria)))];

  const produtosFiltrados = produtos.filter((p) => {
    const matchCat = selectedCategoria === 'todas' || p.categoria === selectedCategoria;
    const matchSearch =
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descricao.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <Package className="w-6 h-6 text-orange-600" />
                Catálogo de Produtos
              </h1>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                Painel do Administrador
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Cadastre, edite e remova os itens do cardápio do seu estabelecimento.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={carregarProdutos}
              disabled={loading}
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              title="Atualizar catálogo"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
            </button>

            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>
        </div>

        {/* Mensagens de Sucesso ou Erro */}
        {successMsg && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Barra de Filtros e Busca (RF11) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs my-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou ingredientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoria(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer capitalize ${
                  selectedCategoria === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Produtos (RF11) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loading && produtos.length === 0 ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Carregando catálogo de produtos...</p>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">Nenhum produto encontrado.</p>
              <button
                onClick={openNewModal}
                className="mt-3 text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
              >
                + Cadastrar primeiro produto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">ID</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Preço</th>
                    <th className="py-3 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produtosFiltrados.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-slate-400">
                        #{p.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.nome}</div>
                        {p.descricao && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {p.descricao}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {p.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {formatCurrency(p.preco)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            title="Alterar produto"
                            className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition border border-slate-200 hover:border-orange-200 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.nome)}
                            title="Excluir produto"
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-slate-200 hover:border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CADASTRO / ALTERAÇÃO DE PRODUTO (RF10, RF12) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-orange-600" />
                {editingProduct ? 'Alterar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: X-Salada Especial"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Categoria *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                  >
                    {CATEGORIAS_PADRAO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={formPreco}
                  onChange={(e) => setFormPreco(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Descrição / Ingredientes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Hambúrguer, alface, tomate, queijo prato e maionese artesanal"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-500/20 transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
